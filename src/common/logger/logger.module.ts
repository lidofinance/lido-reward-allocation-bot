import { WinstonModule } from 'nest-winston';
import { ConfigModule, ConfigService, LogFormat } from 'common/config';
import * as winston from 'winston';

export const LoggerModule = WinstonModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: async (configService: ConfigService) => ({
    level: configService.get('LOG_LEVEL', { infer: true }),
    transports: [
      new winston.transports.Console({
        format:
          configService.get('LOG_FORMAT', { infer: true }) === LogFormat.json
            ? winston.format.json()
            : winston.format.combine(
                winston.format.colorize({ all: true }),
                winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                winston.format.simple(),
                winston.format.printf((log) => {
                  const { timestamp, level, message, context } = log;
                  const extra = context ? JSON.stringify(context) : '';

                  return `${timestamp} ${level}: ${message} ${extra}`;
                }),
              ),
      }),
    ],
  }),
});
