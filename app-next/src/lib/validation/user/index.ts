import { z } from 'zod';

export const userParamsSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format'),
  }).strict(),
});

export const userCreateSchema = z.object({
  body: z.object({
    username: z.string().min(1, 'Username is required'),
    name: z.string().min(1, 'Name is required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    active: z.boolean().optional(),
    role: z.enum(['ADMIN', 'HR', 'VIEWER']).optional().default('ADMIN'),
  }).strict(),
});

export const userUpdateSchema = z.object({
  body: z.object({
    username: z.string().min(1).optional(),
    name: z.string().min(1).optional(),
    password: z.string().min(8).optional(),
    active: z.boolean().optional(),
    role: z.enum(['ADMIN', 'HR', 'VIEWER']).optional(),
  }).strict(),
});

export const userSearchSchema = z.object({
  query: z.object({
    q: z.string().optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional().default(1),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default(10),
    sortBy: z.enum(['name', 'username', 'createdAt']).optional().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  }).strict(),
});
