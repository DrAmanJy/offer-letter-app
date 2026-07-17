import { OfferController } from '@/controllers/OfferController';
import { withErrorHandler } from '@/middleware/errorHandler';
import { connectDB } from '@/infrastructure/database/mongoose';
import { NextRequest } from 'next/server';

export const GET = withErrorHandler(async (req: NextRequest) => {
  await connectDB();
  return OfferController.list(req);
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  await connectDB();
  return OfferController.create(req);
});
