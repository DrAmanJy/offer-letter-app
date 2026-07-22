import mongoose, { Schema, Document } from 'mongoose';

export interface ICompany extends Document {
  name: string;
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  address?: string;
  defaultOfferTemplate?: string;
  isDeleted: boolean;
  deletedAt?: Date | null;
  deletedBy?: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const companySchema = new Schema<ICompany>(
  {
    name: { type: String, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    address: { type: String, trim: true },
    defaultOfferTemplate: { type: String, trim: true, default: '' },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true, strict: true }
);

// Indexes for searching
companySchema.index({ name: 1, isDeleted: 1 });
companySchema.index({ isDeleted: 1 });

export const Company = mongoose.models.Company || mongoose.model<ICompany>('Company', companySchema);
