import { OfferController } from '@/controllers/OfferController';
import { withErrorHandler } from '@/middleware/errorHandler';
import { connectDB } from '@/infrastructure/database/mongoose';
import { NextRequest, NextResponse } from 'next/server';

export const GET = withErrorHandler(async (req: NextRequest) => {
  await connectDB();
  const response = await OfferController.getPublicOffer(req);

  // Parse the existing response to wrap it in a new NextResponse with CORS headers
  const data = await response.json();
  const res = NextResponse.json(data, { status: response.status });
  
  // Add CORS headers to allow other sites to fetch this data
  res.headers.set('Access-Control-Allow-Origin', '*');
  res.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  return res;
});

export const OPTIONS = async () => {
  const res = new NextResponse(null, { status: 204 });
  res.headers.set('Access-Control-Allow-Origin', '*');
  res.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return res;
};
