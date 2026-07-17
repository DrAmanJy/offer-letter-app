import { CompanyController } from '@/controllers/CompanyController';
import { withErrorHandler } from '@/middleware/errorHandler';
import { connectDB } from '@/infrastructure/database/mongoose';
import { NextRequest } from 'next/server';

export const GET = withErrorHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  await connectDB();
  return CompanyController.getById(req, { params });
});

export const PATCH = withErrorHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  await connectDB();
  return CompanyController.update(req, { params });
});

export const DELETE = withErrorHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  await connectDB();
  return CompanyController.delete(req, { params });
});
