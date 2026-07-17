import { cookies } from 'next/headers';
import { env } from '../config/env';

interface CookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'lax' | 'strict' | 'none';
  domain?: string;
  path?: string;
  maxAge: number;
}

// Convert string like "15m", "30d" to ms roughly for maxAge
const parseDurationToMs = (duration: string): number => {
  const match = duration.match(/^(\d+)([a-z]+)$/);
  if (!match) return 0;
  const value = parseInt(match[1], 10);
  const unit = match[2];
  
  switch(unit) {
    case 'm': return value * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    default: return value;
  }
};

export const setAuthCookies = async (accessToken: string, refreshToken: string) => {
  const cookieStore = await cookies();
  const baseOptions: Omit<CookieOptions, 'maxAge'> = {
    httpOnly: true,
    secure: env.NODE_ENV === 'production' ? true : env.COOKIE_SECURE,
    sameSite: env.COOKIE_SAME_SITE,
    ...(env.COOKIE_DOMAIN && { domain: env.COOKIE_DOMAIN }),
  };

  cookieStore.set('accessToken', accessToken, {
    ...baseOptions,
    path: '/',
    maxAge: parseDurationToMs(env.JWT_ACCESS_EXPIRES) / 1000,
  });

  cookieStore.set('refreshToken', refreshToken, {
    ...baseOptions,
    path: '/api/v1/auth',
    maxAge: parseDurationToMs(env.JWT_REFRESH_EXPIRES) / 1000,
  });
};

export const clearAuthCookies = async () => {
  const cookieStore = await cookies();
  const baseOptions = {
    httpOnly: true,
    secure: env.NODE_ENV === 'production' ? true : env.COOKIE_SECURE,
    sameSite: env.COOKIE_SAME_SITE,
    ...(env.COOKIE_DOMAIN && { domain: env.COOKIE_DOMAIN }),
  };

  cookieStore.set('accessToken', '', { ...baseOptions, path: '/', maxAge: 0 });
  cookieStore.set('refreshToken', '', { ...baseOptions, path: '/api/v1/auth', maxAge: 0 });
};
