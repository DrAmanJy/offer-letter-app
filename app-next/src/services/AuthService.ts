import { User } from "../models/User";
import { RefreshToken } from "../models/RefreshToken";
import { hashPassword, comparePassword } from "../lib/password";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../lib/jwt";
import { UnauthorizedError } from "../lib/errors";
import { logger } from "../infrastructure/logger";
import { env } from "../config/env";
import crypto from "crypto";

export class AuthService {
  static async login(
    username: string,
    pass: string,
    ip?: string,
    userAgent?: string,
  ) {
    const identifier = username.toLowerCase();
    const user = await User.findOne({ username: identifier }).select("+password");
    if (!user) {
      logger.warn(`Login failed for username: ${username}`);
      throw new UnauthorizedError("Invalid credentials");
    }

    if (user.isDeleted) {
      logger.warn(`Login failed: Deleted user ${user._id}`);
      throw new UnauthorizedError("Invalid credentials");
    }

    if (!user.active) {
      logger.warn(`Login failed: Inactive user ${user._id}`);
      throw new UnauthorizedError("Invalid credentials");
    }

    const isMatch = await comparePassword(pass, user.password!);
    if (!isMatch) {
      logger.warn(`Login failed: Failed password for user ${user._id}`);
      throw new UnauthorizedError("Invalid username or password");
    }

    const payload = { sub: user._id.toString() };
    const accessToken = await generateAccessToken(payload);
    const refreshTokenStr = await generateRefreshToken(payload);

    const hashedRefreshToken = crypto
      .createHash("sha256")
      .update(refreshTokenStr)
      .digest("hex");

    // Convert duration to MS
    const match = env.JWT_REFRESH_EXPIRES.match(/^(\d+)([a-z]+)$/);
    let ms = 30 * 24 * 60 * 60 * 1000;
    if (match) {
      const val = parseInt(match[1]);
      if (match[2] === "d") ms = val * 24 * 60 * 60 * 1000;
      if (match[2] === "m") ms = val * 60 * 1000;
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
        const payload = await verifyRefreshToken(refreshToken);
        if (payload && payload.sub === userId) {
          const hashedToken = crypto
            .createHash("sha256")
            .update(refreshToken)
            .digest("hex");
          const t = await RefreshToken.findOne({
            userId,
            tokenHash: hashedToken,
            revoked: false,
          });
          if (t) {
            t.revoked = true;
            await t.save();
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
      const payload = await verifyRefreshToken(token);

      const user = await User.findById(payload.sub);
      if (!user || user.isDeleted || !user.active) {
        logger.warn(
          `Refresh failed: User not found or inactive for sub ${payload.sub}`,
        );
        throw new UnauthorizedError("Invalid refresh token");
      }

      const hashedToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
      const matchedTokenDoc = await RefreshToken.findOne({
        userId: user._id,
        tokenHash: hashedToken,
        revoked: false,
        expiresAt: { $gt: new Date() },
      });

      if (!matchedTokenDoc) {
        logger.warn(
          `Refresh failed: Expired or unrecorded refresh token for user ${user._id}`,
        );
        throw new UnauthorizedError("Invalid refresh token");
      }

      // Rotate
      matchedTokenDoc.revoked = true;
      matchedTokenDoc.lastUsedAt = new Date();
      await matchedTokenDoc.save();

      const newPayload = { sub: user._id.toString() };
      const newAccessToken = await generateAccessToken(newPayload);
      const newRefreshTokenStr = await generateRefreshToken(newPayload);

      const hashedNewRefreshToken = crypto
        .createHash("sha256")
        .update(newRefreshTokenStr)
        .digest("hex");

      const match = env.JWT_REFRESH_EXPIRES.match(/^(\d+)([a-z]+)$/);
      let ms = 30 * 24 * 60 * 60 * 1000;
      if (match) {
        const val = parseInt(match[1]);
        if (match[2] === "d") ms = val * 24 * 60 * 60 * 1000;
        if (match[2] === "m") ms = val * 60 * 1000;
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
      throw new UnauthorizedError("Invalid refresh token");
    }
  }

  static async me(userId: string) {
    const user = await User.findById(userId);
    if (!user || user.isDeleted || !user.active) {
      throw new UnauthorizedError("User not found or inactive");
    }
    return {
      id: user._id,
      name: user.name,
      username: user.username,
      role: user.role,
    };
  }
}
