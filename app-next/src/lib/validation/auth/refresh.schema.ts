import { z } from 'zod';

export const refreshSchema = z.object({
  cookies: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }).passthrough(), // Cookies can have other fields, but we only care about refreshToken
});
