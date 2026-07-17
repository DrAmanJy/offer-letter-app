import pino from 'pino';
import { env } from '../../config/env';
import fs from 'fs';
import path from 'path';

const logDir = path.resolve(process.cwd(), 'logs');
const currentLogDir = path.join(logDir, 'current');

// Ensure log directories exist
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);
if (!fs.existsSync(currentLogDir)) fs.mkdirSync(currentLogDir);

const transports = pino.transport({
  targets: [
    {
      level: env.NODE_ENV === 'production' ? 'info' : 'debug',
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
      },
    },
    {
      level: 'info',
      target: 'pino/file',
      options: { destination: path.join(currentLogDir, 'app.log') },
    },
    {
      level: 'error',
      target: 'pino/file',
      options: { destination: path.join(currentLogDir, 'error.log') },
    },
  ],
});

export const logger = pino(transports);
