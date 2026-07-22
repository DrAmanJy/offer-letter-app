import { z } from 'zod';

export const offerParamsSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid offer ID format'),
  }).strict(),
});

export const offerCreateSchema = z.object({
  body: z.object({
    company: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid company ID format'),
    employee: z.object({
      name: z.string().min(1, 'Employee name is required'),
      email: z.string().email('Invalid email'),
      phone: z.string().optional(),
      nationality: z.string().optional(),
      passportNumber: z.string().optional(),
    }).strict(),
    employment: z.object({
      position: z.string().min(1, 'Position is required'),
      department: z.string().optional(),
      location: z.string().optional(),
      employmentType: z.string().optional(),
      standardHours: z.string().optional(),
      salary: z.number().positive('Salary must be positive'),
      currency: z.string().min(1, 'Currency is required'),
      joiningDate: z.string().datetime({ message: 'Must be valid ISO datetime' }),
      managerName: z.string().optional(),
      probationPeriod: z.string().optional(),
      noticePeriod: z.string().optional(),
    }).strict(),
    terms: z.string().optional(),
    offerContent: z.string().min(1, 'Offer content is required'),
    status: z.enum(['Draft', 'Pending', 'Approved', 'Rejected', 'Sent', 'Accepted']).optional().default('Draft'),
  }).strict(),
});

export const offerUpdateSchema = z.object({
  body: z.object({
    company: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid company ID format').optional(),
    status: z.enum(['Draft', 'Pending', 'Approved', 'Rejected', 'Sent', 'Accepted']).optional(),
    employee: z.object({
      name: z.string().min(1).optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      nationality: z.string().optional(),
      passportNumber: z.string().optional(),
    }).strict().optional(),
    employment: z.object({
      position: z.string().min(1).optional(),
      department: z.string().optional(),
      location: z.string().optional(),
      employmentType: z.string().optional(),
      standardHours: z.string().optional(),
      salary: z.number().positive().optional(),
      currency: z.string().min(1).optional(),
      joiningDate: z.string().datetime().optional(),
      managerName: z.string().optional(),
      probationPeriod: z.string().optional(),
      noticePeriod: z.string().optional(),
    }).strict().optional(),
    terms: z.string().optional(),
    offerContent: z.string().optional(),
  }).strict(),
});

export const offerStatusUpdateSchema = z.object({
  body: z.object({
    status: z.enum(['Draft', 'Pending', 'Approved', 'Rejected', 'Sent', 'Accepted']),
  }).strict(),
});

export const offerSearchSchema = z.object({
  query: z.object({
    q: z.string().optional(),
    status: z.union([z.enum(['Draft', 'Pending', 'Approved', 'Rejected', 'Sent', 'Accepted']), z.literal('')]).optional().transform(val => val === '' ? undefined : val),
    page: z.string().regex(/^\d+$/).transform(Number).optional().default(1),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default(10),
    sortBy: z.enum(['createdAt', 'updatedAt', 'reference']).optional().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  }).strict(),
});
