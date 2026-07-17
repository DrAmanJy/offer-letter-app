import { Request, Response, NextFunction } from 'express';
import { Offer } from '../models/Offer';
import { AppError, NotFoundError } from '../lib/errors';
import { sendSuccess } from '../lib/response';
import mongoose from 'mongoose';

export class PublicController {
  static async getOffer(req: Request, res: Response, next: NextFunction) {
    try {
      const { companyId, reference } = req.params;

      if (!mongoose.Types.ObjectId.isValid(companyId as string)) {
        throw new AppError('Invalid company ID format', 400);
      }

      const offer = await Offer.findOne({
        company: companyId,
        reference,
        isDeleted: false,
      }).populate('company', 'name').lean();

      if (!offer) {
        throw new NotFoundError('Offer not found');
      }

      return sendSuccess( 'Offer retrieved successfully', offer);
    } catch (error) {
      next(error);
    }
  }
}
