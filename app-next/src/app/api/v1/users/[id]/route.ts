import { UserController } from '@/controllers/UserController';
import { withErrorHandler } from '@/middleware/errorHandler';
import { connectDB } from '@/infrastructure/database/mongoose';
import { NextRequest } from 'next/server';

export const GET = withErrorHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  await connectDB();
  return UserController.getById(req, { params });
});

export const PATCH = withErrorHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  await connectDB();
  return UserController.update(req, { params });
});

export const DELETE = withErrorHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  await connectDB();
  return UserController.delete(req, { params });
});
