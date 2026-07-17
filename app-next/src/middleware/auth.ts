import { NextRequest } from 'next/server';
import { verifyAccessToken } from '../lib/jwt';
import { User } from '../models/User';
import { UnauthorizedError, ForbiddenError } from '../lib/errors';
import { logger } from '../infrastructure/logger';

export const authenticate = async (req: NextRequest) => {
  try {
    const accessToken = req.cookies.get('accessToken')?.value;
    if (!accessToken) {
      throw new UnauthorizedError('Authentication required');
    }

    const payload = verifyAccessToken(accessToken);
    const user = await User.findById(payload.sub);

    if (!user || user.isDeleted || !user.active) {
      throw new UnauthorizedError('User not found or inactive');
    }

    return {
      id: user._id.toString(),
    };
  } catch (error) {
    logger.warn('Authentication failed: Invalid or missing token');
    throw new UnauthorizedError('Invalid or expired token');
  }
};

export const requireAdmin = async (req: NextRequest) => {
  return await authenticate(req);
};

export const requireHR = async (req: NextRequest) => {
  return await authenticate(req);
};
