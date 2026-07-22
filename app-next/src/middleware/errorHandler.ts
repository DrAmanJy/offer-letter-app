import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { AppError } from '../lib/errors';
import { logger } from '../infrastructure/logger';
import { sendError } from '../lib/response';
import mongoose from 'mongoose';
import { env } from '../config/env';

export const handleApiError = (err: any, req?: Request): NextResponse => {
  const correlationId = req?.headers.get('x-correlation-id') || 'unknown';
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

  if (err instanceof SyntaxError) {
      return sendError('Invalid JSON payload', undefined, 400);
  }

  // Unknown Errors
  logger.error({ err, correlationId });

  const message = env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message || 'An unknown error occurred';
  return sendError(message, undefined, 500);
};

export function withErrorHandler(handler: Function) {
  return async (...args: any[]) => {
    try {
      const req = args[0] as Request;
      if (req && req.method && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
        const contentType = req.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          return sendError('Unsupported Media Type: application/json required', undefined, 415);
        }

        const contentLength = req.headers.get('content-length');
        if (contentLength && parseInt(contentLength, 10) > 1048576) {
          return sendError('Payload Too Large: maximum 1MB allowed', undefined, 413);
        }
      }
      return await handler(...args);
    } catch (err: unknown) {
      const req = args[0] as Request;
      return handleApiError(err, req);
    }
  };
}
