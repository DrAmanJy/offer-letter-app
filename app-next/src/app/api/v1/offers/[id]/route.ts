import { OfferController } from '@/controllers/OfferController';
import { withErrorHandler } from '@/middleware/errorHandler';
import { connectDB } from '@/infrastructure/database/mongoose';
import { NextRequest } from 'next/server';

export const GET = withErrorHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  await connectDB();
  return OfferController.getById(req, { params });
});

export const PATCH = withErrorHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  await connectDB();
  return OfferController.update(req, { params });
});

export const PUT = withErrorHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  await connectDB();
  return OfferController.update(req, { params });
});

export const DELETE = withErrorHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  await connectDB();
  return OfferController.delete(req, { params });
});
