import { AuthController } from '@/controllers/AuthController';
import { withErrorHandler } from '@/middleware/errorHandler';
import { connectDB } from '@/infrastructure/database/mongoose';
import { sendError } from '@/lib/response';

const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

export const POST = withErrorHandler(async (req: Request) => {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const now = Date.now();
  
  const record = rateLimitMap.get(ip) || { count: 0, lastReset: now };
  if (now - record.lastReset > 60000) {
    record.count = 0;
    record.lastReset = now;
  }
  
  if (record.count >= 5) {
    return sendError('Too many requests, please try again later', undefined, 429);
  }
  
  record.count += 1;
  rateLimitMap.set(ip, record);

  await connectDB();
  return AuthController.login(req as any);
});
