import { AuthController } from '@/controllers/AuthController';
import { withErrorHandler } from '@/middleware/errorHandler';
import { connectDB } from '@/infrastructure/database/mongoose';

export const POST = withErrorHandler(async (req: Request) => {
  await connectDB();
  return AuthController.login(req as any);
});
