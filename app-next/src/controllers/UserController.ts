import { NextRequest } from 'next/server';
import { UserService } from '../services/UserService';
import { userCreateSchema, userUpdateSchema, userSearchSchema, userParamsSchema } from '../validators/user';
import { sendSuccess } from '../lib/response';
import { requireAdmin } from '../middleware/auth';

export class UserController {
  static async create(req: NextRequest) {
    await requireAdmin(req);
    const body = await req.json().catch(() => ({}));
    const data = userCreateSchema.parse({ body }).body;
    const user = await UserService.create(data as any);
    return sendSuccess('User created successfully', user, undefined, 201);
  }

  static async list(req: NextRequest) {
    await requireAdmin(req);
    const searchParams = Object.fromEntries(req.nextUrl.searchParams);
    const query = userSearchSchema.parse({ query: searchParams }).query;
    const result = await UserService.list(query);
    return sendSuccess('Users retrieved successfully', result);
  }

  static async getById(req: NextRequest, { params }: { params: { id: string } }) {
    await requireAdmin(req);
    const { id } = userParamsSchema.parse({ params }).params;
    const user = await UserService.getById(id);
    return sendSuccess('User retrieved successfully', user);
  }

  static async update(req: NextRequest, { params }: { params: { id: string } }) {
    const adminUser = await requireAdmin(req);
    const { id } = userParamsSchema.parse({ params }).params;
    const body = await req.json().catch(() => ({}));
    const data = userUpdateSchema.parse({ body }).body;
    
    const user = await UserService.update(id, data as any, adminUser.id);
    return sendSuccess('User updated successfully', user);
  }

  static async delete(req: NextRequest, { params }: { params: { id: string } }) {
    const adminUser = await requireAdmin(req);
    const { id } = userParamsSchema.parse({ params }).params;
    await UserService.softDelete(id, adminUser.id);
    return sendSuccess('User deleted successfully');
  }

  static async restore(req: NextRequest, { params }: { params: { id: string } }) {
    await requireAdmin(req);
    const { id } = userParamsSchema.parse({ params }).params;
    await UserService.restore(id);
    return sendSuccess('User restored successfully');
  }
}
