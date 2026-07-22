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

    const payload = await verifyAccessToken(accessToken);
    const user = await User.findById(payload.sub);

    if (!user || user.isDeleted || !user.active) {
      throw new UnauthorizedError('User not found or inactive');
    }

    return {
      id: user._id.toString(),
      role: user.role,
    };
  } catch (error) {
    logger.warn('Authentication failed: Invalid or missing token');
    throw new UnauthorizedError('Invalid or expired token');
  }
};

export const requireAdmin = async (req: NextRequest) => {
  const user = await authenticate(req);
  if (user.role !== 'ADMIN') {
    throw new ForbiddenError('Admin access required');
  }
  return user;
};

export const requireHR = async (req: NextRequest) => {
  const user = await authenticate(req);
  if (user.role !== 'ADMIN' && user.role !== 'HR') {
    throw new ForbiddenError('HR access required');
  }
  return user;
};
