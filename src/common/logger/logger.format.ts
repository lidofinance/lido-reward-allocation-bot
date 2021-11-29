import { ConfigService } from 'common/config';
import * as winston from 'winston';

export const json = (configService: ConfigService) => {
  return winston.format.combine(
    cleanSecrets({ secrets: configService.secrets }),
    winston.format.json(),
  );
};

export const simple = (configService: ConfigService) => {
  return winston.format.combine(
    cleanSecrets({ secrets: configService.secrets }),
    winston.format.colorize({ all: true }),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.simple(),
    winston.format.printf((log) => {
      const { timestamp, level, message, context, block } = log;
      const extra = context ? JSON.stringify(context) : '';

      return `${timestamp} [${block}] ${level}: ${message} ${extra}`;
    }),
  );
};

const cleanSecrets = winston.format((info, opts) => {
  info.message = opts.secrets.reduce((result, secret) => {
    return result.replace(secret, '<removed>');
  }, info.message);

  return info;
});
