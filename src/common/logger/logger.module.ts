import { WinstonModule } from 'nest-winston';
import { ConfigModule, ConfigService, LogFormat } from 'common/config';
import * as winston from 'winston';
import { ProviderService } from 'provider';
import { ModuleRef } from '@nestjs/core';

export const LoggerModule = WinstonModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService, ModuleRef],
  useFactory: async (configService: ConfigService, moduleRef: ModuleRef) => ({
    level: configService.get('LOG_LEVEL', { infer: true }),
    defaultMeta: {
      get block() {
        const providerService = moduleRef.get(ProviderService, {
          strict: false,
        });
        return providerService.provider.blockNumber;
      },
    },
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
                  const { timestamp, level, message, context, block } = log;
                  const extra = context ? JSON.stringify(context) : '';

                  return `${timestamp} [${block}] ${level}: ${message} ${extra}`;
                }),
              ),
      }),
    ],
  }),
});
