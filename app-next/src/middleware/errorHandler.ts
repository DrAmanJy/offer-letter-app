import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { AppError } from '../lib/errors';
import { logger } from '../infrastructure/logger';
import { sendError } from '../lib/response';
import mongoose from 'mongoose';
import { env } from '../config/env';

export const handleApiError = (err: any): NextResponse => {
  if (err instanceof AppError) {
    return sendError(err.message, err.errors, err.statusCode);
  }

  if (err instanceof ZodError) {
    const formattedErrors = err.issues.map((e: any) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return sendError('Validation failed', formattedErrors, 400);
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const formattedErrors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return sendError('Database validation failed', formattedErrors, 400);
  }

  if (err.name === 'MongoServerError' && err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return sendError(`Duplicate key error: ${field} already exists`, undefined, 409);
  }

  if (err.name === 'CastError') {
    return sendError('Invalid ID format', undefined, 400);
  }
  
  if (err.name === 'TokenExpiredError') {
      return sendError('Token expired', undefined, 401);
  }

  if (err.name === 'JsonWebTokenError') {
      return sendError('Invalid token', undefined, 401);
  }

  // Unknown Errors
  logger.error(err);

  const message = env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message || 'An unknown error occurred';
  return sendError(message, undefined, 500);
};

export function withErrorHandler(handler: Function) {
  return async (...args: any[]) => {
    try {
      return await handler(...args);
    } catch (err: any) {
      return handleApiError(err);
    }
  };
}
