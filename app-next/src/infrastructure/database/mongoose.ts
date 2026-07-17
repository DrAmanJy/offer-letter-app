import mongoose from 'mongoose';
import { env } from '../../config/env';
import { logger } from '../logger';

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
    };

    cached.promise = mongoose.connect(env.MONGODB_URI, opts).then((mongoose) => {
      logger.info(`MongoDB connected: ${mongoose.connection.host}`);
      return mongoose;
    }).catch(error => {
      logger.error(error, 'Error connecting to MongoDB');
      throw error;
    });
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
