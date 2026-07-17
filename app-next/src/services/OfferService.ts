import mongoose from 'mongoose';
import { Offer, IOffer } from '../models/Offer';
import { Company } from '../models/Company';
import { Counter } from '../models/Counter';
import { NotFoundError } from '../lib/errors';
import { logger } from '../infrastructure/logger';

export class OfferService {
  private static async generateReference(): Promise<string> {
    const year = new Date().getFullYear();
    const counterId = `OFF-${year}`;
    
    const counter = await Counter.findByIdAndUpdate(
      counterId,
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    
    const sequence = counter.seq.toString().padStart(6, '0');
    return `${counterId}-${sequence}`;
  }

  private static generateOfferContent(data: Partial<IOffer>, reference: string, companyName: string): string {
    const dateOfIssue = new Date().toLocaleDateString('en-GB');
    const termsStr = data.terms ? `\n${data.terms}\n` : '';
    
    return `Contract of Employment
Date of Issue: ${dateOfIssue}

Reference Number: ${reference}

Dear ${data.employee?.name || '[Candidate Name]'},

Following our recent interviews and skills assessment, we are delighted to formally offer you a position with ${companyName}. We believe your international experience and dedication will be a highly valuable addition to our team.

Position Title
${data.employment?.position || 'N/A'}
Department
${data.employment?.department || 'N/A'}
Location
${data.employment?.location || 'N/A'}
Employment Type
${data.employment?.employmentType || 'N/A'}
Base Salary
${data.employment?.currency || '$'} ${data.employment?.salary?.toLocaleString() || 'N/A'} / Annum
Standard Hours
${data.employment?.standardHours || 'N/A'}
${termsStr}
To formally accept this offer, please sign and return the complete contract package which will be sent to you via secure email by our Human Resources department.

We look forward to welcoming you to the ${companyName.split(' ')[0]} family.

Human Resources Department

${companyName}`;
  }

  static async create(data: Partial<IOffer>, currentUserId: string) {
    const reference = await this.generateReference();
    
    let companyName = 'Unknown Company';
    if (data.company) {
      const companyObj = await Company.findById(data.company);
      if (companyObj) companyName = companyObj.name;
    }
    
    const offerData = {
      ...data,
      reference,
      offerContent: data.offerContent || this.generateOfferContent(data, reference, companyName),
      createdBy: new mongoose.Types.ObjectId(currentUserId),
      updatedBy: new mongoose.Types.ObjectId(currentUserId),
    };
    
    const offer = await Offer.create(offerData);
    logger.info(`Offer created: ${reference} by user ${currentUserId}`);
    return offer;
  }

  static async update(id: string, data: Partial<IOffer>, currentUserId: string) {
    const offer = await Offer.findOne({ _id: id, isDeleted: false });
    if (!offer) throw new NotFoundError('Offer not found');
    
    // Ensure nested objects merge properly instead of overwrite completely, but here we can just update top level
    if (data.employee) Object.assign(offer.employee, data.employee);
    if (data.employment) Object.assign(offer.employment, data.employment);
    if (data.terms !== undefined) offer.terms = data.terms;
    
    let companyName = 'Unknown Company';
    const companyObj = await Company.findById(data.company || offer.company);
    if (companyObj) companyName = companyObj.name;
    
    if (data.offerContent !== undefined) {
      offer.offerContent = data.offerContent;
    } else {
      offer.offerContent = this.generateOfferContent(offer, offer.reference, companyName);
    }
    
    offer.updatedBy = new mongoose.Types.ObjectId(currentUserId);
    await offer.save();
    
    logger.info(`Offer updated: ${offer.reference} by user ${currentUserId}`);
    return offer;
  }

  static async updateStatus(id: string, status: string, currentUserId: string) {
    const offer = await Offer.findOne({ _id: id, isDeleted: false });
    if (!offer) throw new NotFoundError('Offer not found');
    
    const oldStatus = offer.status;
    offer.status = status as any;
    offer.updatedBy = new mongoose.Types.ObjectId(currentUserId);
    await offer.save();
    
    logger.info(`Offer status changed: ${offer.reference} from ${oldStatus} to ${status} by user ${currentUserId}`);
    return offer;
  }

  static async getById(id: string) {
    const offer = await Offer.findOne({ _id: id, isDeleted: false })
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .lean();
      
    if (!offer) throw new NotFoundError('Offer not found');
    return offer;
  }

  static async getPublicOffer(companyId: string, reference: string) {
    const offer = await Offer.findOne({ company: companyId, reference, isDeleted: false })
      .populate('company', 'name')
      .lean();
      
    if (!offer) throw new NotFoundError('Offer not found');
    return offer;
  }

  static async list(query: any) {
    const filter: any = { isDeleted: false };
    
    if (query.status) {
      filter.status = query.status;
    }
    
    if (query.q) {
      filter.$text = { $search: query.q };
    }

    const sort: any = { [query.sortBy]: query.sortOrder === 'asc' ? 1 : -1 };
    const skip = (query.page - 1) * query.limit;

    const [data, total] = await Promise.all([
      Offer.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(query.limit)
        .populate('createdBy', 'name email')
        .lean(),
      Offer.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / query.limit);
    return {
      items: data,
      pagination: {
        page: query.page,
        limit: query.limit,
        totalItems: total,
        totalPages,
        hasNext: query.page < totalPages,
        hasPrev: query.page > 1,
      },
    };
  }

  static async softDelete(id: string, currentUserId: string) {
    const offer = await Offer.findOne({ _id: id, isDeleted: false });
    if (!offer) throw new NotFoundError('Offer not found');

    offer.isDeleted = true;
    offer.deletedAt = new Date();
    offer.deletedBy = new mongoose.Types.ObjectId(currentUserId);
    await offer.save();
    
    logger.info(`Offer soft deleted: ${offer.reference} by user ${currentUserId}`);
  }

  static async restore(id: string, currentUserId: string) {
    const offer = await Offer.findOne({ _id: id, isDeleted: true });
    if (!offer) throw new NotFoundError('Offer not found or not deleted');

    offer.isDeleted = false;
    offer.deletedAt = null;
    offer.deletedBy = null;
    offer.updatedBy = new mongoose.Types.ObjectId(currentUserId);
    await offer.save();
    
    logger.info(`Offer restored: ${offer.reference} by user ${currentUserId}`);
  }
}
