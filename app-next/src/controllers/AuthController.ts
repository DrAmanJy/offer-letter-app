import { NextRequest } from 'next/server';
import { AuthService } from '../services/AuthService';
import { loginSchema } from '../validators/auth/login.schema';
import { refreshSchema } from '../validators/auth/refresh.schema';
import { setAuthCookies, clearAuthCookies } from '../lib/cookies';
import { sendSuccess } from '../lib/response';
import { logger } from '../infrastructure/logger';
import { authenticate } from '../middleware/auth';

export class AuthController {
  static async login(req: NextRequest) {
    const body = await req.json().catch(() => ({}));
    const { email, password } = loginSchema.parse({ body }).body;
    
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || '';
    
    const { user, accessToken, refreshTokenStr } = await AuthService.login(email, password, ip, userAgent);
    
    await setAuthCookies(accessToken, refreshTokenStr);
    logger.info(`User logged in successfully: ${user._id}`);
    
    return sendSuccess('Login successful', user);
  }

  static async logout(req: NextRequest) {
    const refreshToken = req.cookies.get('refreshToken')?.value;
    
    // We only need the userId, and we don't want to throw if the token is invalid 
    // because logout should clear cookies anyway. 
    // But since the original Express route used `router.use(authenticate)`,
    // we'll authenticate the user strictly as it did before.
    const user = await authenticate(req);
    
    if (user.id && refreshToken) {
      await AuthService.logout(user.id, refreshToken);
    }
    await clearAuthCookies();
    logger.info(`User logged out: ${user.id || 'unknown'}`);
    return sendSuccess('Logout successful');
  }

  static async refresh(req: NextRequest) {
    const cookiesObj = { refreshToken: req.cookies.get('refreshToken')?.value };
    const { refreshToken } = refreshSchema.parse({ cookies: cookiesObj }).cookies;
    
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || '';

    const tokens = await AuthService.refresh(refreshToken, ip, userAgent);
    await setAuthCookies(tokens.accessToken, tokens.refreshToken);
    
    logger.info('Refresh token rotated');
    return sendSuccess('Token refreshed successfully');
  }

  static async me(req: NextRequest) {
    const user = await authenticate(req);
    const userProfile = await AuthService.me(user.id);
    return sendSuccess('User profile retrieved', userProfile);
  }
}
