import { AuthController } from '@/controllers/AuthController';
import { withErrorHandler } from '@/middleware/errorHandler';
import { connectDB } from '@/infrastructure/database/mongoose';

export const GET = withErrorHandler(async (req: Request) => {
  await connectDB();
  return AuthController.me(req as any);
});
