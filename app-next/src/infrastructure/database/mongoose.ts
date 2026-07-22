import mongoose from 'mongoose';
import dns from 'dns';
import { env } from '../../config/env';
import { logger } from '../logger';

// Force IPv4 first and set public Google/Cloudflare DNS to bypass local ISP SRV blocks
try {
  dns.setDefaultResultOrder('ipv4first');
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {
  // Ignore if restricted
}

// @ts-ignore
let cached = global.mongoose;

if (!cached) {
  // @ts-ignore
  cached = global.mongoose = { conn: null, promise: null };
}

export const connectDB = async () => {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 8000,
    };

    const doConnect = async () => {
      try {
        dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
      } catch (_) {}

      try {
        const m = await mongoose.connect(env.MONGODB_URI, opts);
        logger.info(`MongoDB connected: ${m.connection.host}`);
        return m;
      } catch (err: any) {
        if (err?.message?.includes('querySrv') || err?.code === 'ECONNREFUSED') {
          logger.warn('Initial SRV lookup failed. Retrying with fallback Google DNS (8.8.8.8)...');
          try {
            dns.setServers(['8.8.8.8', '8.8.4.4']);
            const m = await mongoose.connect(env.MONGODB_URI, opts);
            logger.info(`MongoDB connected via DNS fallback: ${m.connection.host}`);
            return m;
          } catch (fallbackErr) {
            logger.error(fallbackErr, 'MongoDB fallback connection failed');
            throw fallbackErr;
          }
        }
        logger.error(err, 'Error connecting to MongoDB');
        throw err;
      }
    };

    cached.promise = doConnect();
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
};

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});

