import mongoose, { Schema, Document } from 'mongoose';

export interface IOffer extends Document {
  reference: string;
  company: mongoose.Types.ObjectId | any;
  employee: {
    name: string;
    email: string;
    phone?: string;
    nationality?: string;
    passportNumber?: string;
  };
  employment: {
    position: string;
    department?: string;
    location?: string;
    employmentType?: string;
    standardHours?: string;
    salary: number;
    currency: string;
    joiningDate: Date;
    managerName?: string;
    probationPeriod?: string;
    noticePeriod?: string;
  };
  terms?: string;
  offerContent: string;
  status: 'Draft' | 'Sent' | 'Opened' | 'Accepted' | 'Rejected' | 'Cancelled' | 'Expired';
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date | null;
  deletedBy?: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const offerSchema = new Schema<IOffer>(
  {
    reference: { type: String, required: true, unique: true },
    company: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    employee: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String },
      nationality: { type: String },
      passportNumber: { type: String },
    },
    employment: {
      position: { type: String, required: true },
      department: { type: String },
      location: { type: String },
      employmentType: { type: String },
      standardHours: { type: String },
      salary: { type: Number, required: true },
      currency: { type: String, required: true },
      joiningDate: { type: Date, required: true },
      managerName: { type: String },
      probationPeriod: { type: String },
      noticePeriod: { type: String },
    },
    terms: { type: String },
    offerContent: { type: String, required: true },
    status: {
      type: String,
      enum: ['Draft', 'Sent', 'Opened', 'Accepted', 'Rejected', 'Cancelled', 'Expired'],
      default: 'Draft',
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true, strict: true }
);

// Indexes for searching
offerSchema.index({ reference: 'text', 'employee.name': 'text', 'employee.email': 'text' });
offerSchema.index({ isDeleted: 1, status: 1 });
offerSchema.index({ company: 1, reference: 1 }); // For public lookup

export const Offer = mongoose.models.Offer || mongoose.model<IOffer>('Offer', offerSchema);
