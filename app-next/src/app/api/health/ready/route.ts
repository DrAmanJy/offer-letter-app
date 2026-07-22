import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/infrastructure/database/mongoose';

export async function GET() {
  try {
    await connectDB();
    if (mongoose.connection.readyState === 1) {
      return NextResponse.json({ status: 'UP', db: 'connected' }, { status: 200 });
    }
    throw new Error('Database not ready');
  } catch (error: any) {
    return NextResponse.json({ status: 'DOWN', error: error.message }, { status: 503 });
  }
}
