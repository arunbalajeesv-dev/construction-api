'use strict';

const pino = require('pino');
const env = require('../config/env');

const logger = pino(
  {
    level: env.NODE_ENV === 'production' ? 'info' : 'debug',
    base: { service: 'construction-api' },
    timestamp: pino.stdTimeFunctions.isoTime,
  },
  env.NODE_ENV !== 'production'
    ? pino.transport({
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:HH:MM:ss',
          ignore: 'pid,hostname',
        },
      })
    : undefined,
);

module.exports = logger;
