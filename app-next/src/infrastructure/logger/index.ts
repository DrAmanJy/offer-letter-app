import pino from 'pino';
import { env } from '../../config/env';

const transports = env.NODE_ENV === 'production' 
  ? undefined // Use default pino stdout for production/serverless
  : pino.transport({
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
      },
    });

export const logger = transports ? pino({ level: 'debug' }, transports) : pino({ level: 'info' });
