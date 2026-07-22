import { Company } from '../models/Company';
import { AppError, NotFoundError } from '../lib/errors';
import mongoose from 'mongoose';

export class CompanyService {
  static async create(data: { name: string }, userId: string) {
    const escapedName = data.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const existing = await Company.findOne({ name: { $regex: new RegExp(`^${escapedName}$`, 'i') }, isDeleted: false });
    if (existing) {
      throw new AppError('Company with this name already exists', 400);
    }

    const company = await Company.create({
      ...data,
      createdBy: userId,
      updatedBy: userId,
    });

    return company;
  }

  static async list(query: { q?: string; page?: number; limit?: number; sortBy?: string; sortOrder?: string }) {
    const { q, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = { isDeleted: false };
    if (q) {
      filter.$text = { $search: q };
    }

    const sort: Record<string, any> = {};
    if (q) {
      sort.score = { $meta: 'textScore' };
    } else {
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    }

    const [companies, total] = await Promise.all([
      Company.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      Company.countDocuments(filter),
    ]);

    return {
      companies,
      total,
      page,
      limit,
    };
  }

  static async getById(id: string) {
    const company = await Company.findOne({ _id: id, isDeleted: false }).lean();
    if (!company) {
      throw new AppError('Company not found', 404);
    }
    return company;
  }

  static async update(id: string, data: { name?: string }, userId: string) {
    const company = await Company.findOne({ _id: id, isDeleted: false });
    if (!company) {
      throw new AppError('Company not found', 404);
    }

    if (data.name && data.name !== company.name) {
      const escapedName = data.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const existing = await Company.findOne({ name: { $regex: new RegExp(`^${escapedName}$`, 'i') }, isDeleted: false, _id: { $ne: id } });
      if (existing) {
        throw new AppError('Company with this name already exists', 400);
      }
    }

    Object.assign(company, data);
    company.updatedBy = new mongoose.Types.ObjectId(userId);
    await company.save();

    return company;
  }

  static async delete(id: string, userId: string) {
    const company = await Company.findOne({ _id: id, isDeleted: false });
    if (!company) {
      throw new AppError('Company not found', 404);
    }

    company.isDeleted = true;
    company.deletedAt = new Date();
    company.deletedBy = new mongoose.Types.ObjectId(userId);
    await company.save();
  }
}
