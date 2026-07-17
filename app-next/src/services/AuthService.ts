import { User } from '../models/User';
import { RefreshToken } from '../models/RefreshToken';
import { hashPassword, comparePassword } from '../lib/password';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../lib/jwt';
import { UnauthorizedError } from '../lib/errors';
import { logger } from '../infrastructure/logger';
import { env } from '../config/env';

export class AuthService {
  static async login(email: string, pass: string, ip?: string, userAgent?: string) {
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    
    if (!user) {
      logger.warn(`Login failed: Unknown email ${email}`);
      throw new UnauthorizedError('Invalid email or password');
    }
    
    if (user.isDeleted) {
      logger.warn(`Login failed: Deleted user ${user._id}`);
      throw new UnauthorizedError('Invalid email or password');
    }
    
    if (!user.active) {
      logger.warn(`Login failed: Inactive user ${user._id}`);
      throw new UnauthorizedError('Invalid email or password');
    }

    const isMatch = await comparePassword(pass, user.password!);
    if (!isMatch) {
      logger.warn(`Login failed: Failed password for user ${user._id}`);
      throw new UnauthorizedError('Invalid email or password');
    }

    const payload = { sub: user._id.toString() };
    const accessToken = generateAccessToken(payload);
    const refreshTokenStr = generateRefreshToken(payload);

    const hashedRefreshToken = await hashPassword(refreshTokenStr);
    
    // Convert duration to MS
    const match = env.JWT_REFRESH_EXPIRES.match(/^(\d+)([a-z]+)$/);
    let ms = 30 * 24 * 60 * 60 * 1000;
    if (match) {
      const val = parseInt(match[1]);
      if (match[2] === 'd') ms = val * 24 * 60 * 60 * 1000;
      if (match[2] === 'm') ms = val * 60 * 1000;
    }

    await RefreshToken.create({
      userId: user._id,
      tokenHash: hashedRefreshToken,
      expiresAt: new Date(Date.now() + ms),
      ip,
      userAgent,
    });

    user.lastLogin = new Date();
    await user.save();

    logger.info(`Login success: user ${user._id}`);

    const userObj = user.toObject();
    delete userObj.password;

    return { user: userObj, accessToken, refreshTokenStr };
  }

  static async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      // Best effort revoke specific token
      try {
        const payload = verifyRefreshToken(refreshToken);
        if (payload && payload.sub === userId) {
          const tokens = await RefreshToken.find({ userId, revoked: false });
          for (const t of tokens) {
            const isMatch = await comparePassword(refreshToken, t.tokenHash);
            if (isMatch) {
              t.revoked = true;
              await t.save();
              break;
            }
          }
        }
      } catch (err) {
        // Ignored, we just want to revoke it if valid
      }
    }
    logger.info(`Logout: user ${userId}`);
  }

  static async refresh(token: string, ip?: string, userAgent?: string) {
    try {
      const payload = verifyRefreshToken(token);
      
      const user = await User.findById(payload.sub);
      if (!user || user.isDeleted || !user.active) {
        logger.warn(`Refresh failed: User not found or inactive for sub ${payload.sub}`);
        throw new UnauthorizedError('Invalid refresh token');
      }

      const activeTokens = await RefreshToken.find({ userId: user._id, revoked: false, expiresAt: { $gt: new Date() } });
      
      let matchedTokenDoc = null;
      for (const t of activeTokens) {
        const isMatch = await comparePassword(token, t.tokenHash);
        if (isMatch) {
          matchedTokenDoc = t;
          break;
        }
      }

      if (!matchedTokenDoc) {
        logger.warn(`Refresh failed: Expired or unrecorded refresh token for user ${user._id}`);
        throw new UnauthorizedError('Invalid refresh token');
      }

      // Rotate
      matchedTokenDoc.revoked = true;
      matchedTokenDoc.lastUsedAt = new Date();
      await matchedTokenDoc.save();

      const newPayload = { sub: user._id.toString() };
      const newAccessToken = generateAccessToken(newPayload);
      const newRefreshTokenStr = generateRefreshToken(newPayload);

      const hashedNewRefreshToken = await hashPassword(newRefreshTokenStr);
      
      const match = env.JWT_REFRESH_EXPIRES.match(/^(\d+)([a-z]+)$/);
      let ms = 30 * 24 * 60 * 60 * 1000;
      if (match) {
        const val = parseInt(match[1]);
        if (match[2] === 'd') ms = val * 24 * 60 * 60 * 1000;
        if (match[2] === 'm') ms = val * 60 * 1000;
      }

      await RefreshToken.create({
        userId: user._id,
        tokenHash: hashedNewRefreshToken,
        expiresAt: new Date(Date.now() + ms),
        ip,
        userAgent,
      });

      return { accessToken: newAccessToken, refreshToken: newRefreshTokenStr };
    } catch (err) {
      throw new UnauthorizedError('Invalid refresh token');
    }
  }

  static async me(userId: string) {
    const user = await User.findById(userId);
    if (!user || user.isDeleted || !user.active) {
      throw new UnauthorizedError('User not found or inactive');
    }
    return {
      id: user._id,
      name: user.name,
      email: user.email,
    };
  }
}
