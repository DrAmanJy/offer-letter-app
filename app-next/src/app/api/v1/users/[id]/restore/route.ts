import { UserController } from '@/controllers/UserController';
import { withErrorHandler } from '@/middleware/errorHandler';
import { connectDB } from '@/infrastructure/database/mongoose';
import { NextRequest } from 'next/server';

export const POST = withErrorHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  await connectDB();
  return UserController.restore(req, { params });
});
