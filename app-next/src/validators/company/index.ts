import { z } from 'zod';

export const companyCreateSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Company name is required'),
  }).strict(),
});

export const companyUpdateSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
  }).strict(),
});

export const companyParamsSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid company ID format'),
  }).strict(),
});

export const companySearchSchema = z.object({
  query: z.object({
    q: z.string().optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional().default(1),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default(10),
    sortBy: z.enum(['createdAt', 'updatedAt', 'name']).optional().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  }).strict(),
});
