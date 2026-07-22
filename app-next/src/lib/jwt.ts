import { SignJWT, jwtVerify } from 'jose';
import { env } from '../config/env';

export interface JwtPayload {
  sub: string;
}

export const generateAccessToken = async (payload: JwtPayload): Promise<string> => {
  const secret = new TextEncoder().encode(env.JWT_ACCESS_SECRET);
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(env.JWT_ACCESS_EXPIRES)
    .sign(secret);
};

export const generateRefreshToken = async (payload: JwtPayload): Promise<string> => {
  const secret = new TextEncoder().encode(env.JWT_REFRESH_SECRET);
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(env.JWT_REFRESH_EXPIRES)
    .sign(secret);
};

export const verifyAccessToken = async (token: string): Promise<JwtPayload> => {
  const secret = new TextEncoder().encode(env.JWT_ACCESS_SECRET);
  const { payload } = await jwtVerify(token, secret, {
    algorithms: ['HS256'],
  });
  return payload as unknown as JwtPayload;
};

export const verifyRefreshToken = async (token: string): Promise<JwtPayload> => {
  const secret = new TextEncoder().encode(env.JWT_REFRESH_SECRET);
  const { payload } = await jwtVerify(token, secret, {
    algorithms: ['HS256'],
  });
  return payload as unknown as JwtPayload;
};
