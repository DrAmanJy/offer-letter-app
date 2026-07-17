import { User, IUser } from '../models/User';
import { hashPassword } from '../lib/password';
import { ValidationError, ForbiddenError, NotFoundError } from '../lib/errors';
import mongoose from 'mongoose';

export class UserService {
  static async create(data: Partial<IUser>) {
    const existing = await User.findOne({ email: data.email?.toLowerCase(), isDeleted: false });
    if (existing) {
      throw new ValidationError('Email already in use');
    }

    if (data.password) {
      data.password = await hashPassword(data.password);
    }
    
    data.email = data.email?.toLowerCase();
    
    const user = await User.create(data);
    const userObj = user.toObject();
    delete userObj.password;
    return userObj;
  }

  static async update(id: string, data: Partial<IUser>, currentUserId: string) {
    const user = await User.findOne({ _id: id, isDeleted: false });
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Admin self-protection
    if (id === currentUserId) {
      if (data.active === false) {
        throw new ForbiddenError('Admin cannot deactivate themselves');
      }
    }

    if (data.email) {
      data.email = data.email.toLowerCase();
      const existing = await User.findOne({ email: data.email, _id: { $ne: id }, isDeleted: false });
      if (existing) {
        throw new ValidationError('Email already in use');
      }
    }

    if (data.password) {
      data.password = await hashPassword(data.password);
    }

    Object.assign(user, data);
    await user.save();

    const userObj = user.toObject();
    delete userObj.password;
    return userObj;
  }

  static async getById(id: string) {
    const user = await User.findOne({ _id: id, isDeleted: false });
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return user;
  }

  static async list(query: { q?: string; page: number; limit: number; sortBy: string; sortOrder: string }) {
    const filter: any = { isDeleted: false };
    
    if (query.q) {
      filter.$or = [
        { name: { $regex: query.q, $options: 'i' } },
        { email: { $regex: query.q, $options: 'i' } },
      ];
    }

    const sort: any = { [query.sortBy]: query.sortOrder === 'asc' ? 1 : -1 };
    const skip = (query.page - 1) * query.limit;

    const [data, total] = await Promise.all([
      User.find(filter).sort(sort).skip(skip).limit(query.limit).lean(),
      User.countDocuments(filter),
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
    if (id === currentUserId) {
      throw new ForbiddenError('Admin cannot delete themselves');
    }

    const user = await User.findOne({ _id: id, isDeleted: false });
    if (!user) {
      throw new NotFoundError('User not found');
    }

    user.isDeleted = true;
    user.deletedAt = new Date();
    user.deletedBy = new mongoose.Types.ObjectId(currentUserId);
    await user.save();
  }

  static async restore(id: string) {
    const user = await User.findOne({ _id: id, isDeleted: true });
    if (!user) {
      throw new NotFoundError('User not found or not deleted');
    }

    user.isDeleted = false;
    user.deletedAt = null;
    user.deletedBy = null;
    await user.save();
  }
}
