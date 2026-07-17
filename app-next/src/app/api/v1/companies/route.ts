import { CompanyController } from '@/controllers/CompanyController';
import { withErrorHandler } from '@/middleware/errorHandler';
import { connectDB } from '@/infrastructure/database/mongoose';
import { NextRequest } from 'next/server';

export const GET = withErrorHandler(async (req: NextRequest) => {
  await connectDB();
  return CompanyController.list(req);
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  await connectDB();
  return CompanyController.create(req);
});
