import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  username: string;
  password?: string;
  active: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  deletedAt?: Date | null;
  deletedBy?: mongoose.Types.ObjectId | null;
  role: 'ADMIN' | 'HR' | 'VIEWER';
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: { type: String, required: true, select: false },
    active: { type: Boolean, default: true },
    lastLogin: { type: Date },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    role: { type: String, enum: ['ADMIN', 'HR', 'VIEWER'], default: 'ADMIN' },
  },
  { timestamps: true, strict: true }
);

export const User = mongoose.models.User || mongoose.model<IUser>('User', userSchema);
