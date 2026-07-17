import { NextResponse } from 'next/server';
import { ApiResponse } from '../types/shared';

export const sendSuccess = <T>(
  message: string,
  data?: T,
  meta?: ApiResponse['meta'],
  statusCode = 200
) => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    ...(data !== undefined && { data }),
    ...(meta !== undefined && { meta }),
  };

  return NextResponse.json(response, { status: statusCode });
};

export const sendError = (
  message: string,
  errors?: unknown[],
  statusCode = 400
) => {
  const response: ApiResponse = {
    success: false,
    message,
    errors: errors || [],
  };

  return NextResponse.json(response, { status: statusCode });
};
