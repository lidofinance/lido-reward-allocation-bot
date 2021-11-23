import { APP_INTERCEPTOR } from '@nestjs/core';
import { Module } from '@nestjs/common';

import { PrometheusModule } from 'common/prometheus';
import { LoggerModule } from 'common/logger';
import { ConfigModule } from 'common/config';
import { SentryInterceptor } from 'common/sentry';
import { HealthModule } from 'common/health';
import { ProviderModule } from 'ethereum/provider';
import { LoaderModule } from 'manifest/loader';
import { AppService } from './app.service';

@Module({
  imports: [
    ProviderModule.forRoot(),
    PrometheusModule,
    LoggerModule,
    ConfigModule,
    HealthModule,
    LoaderModule,
  ],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: SentryInterceptor },
    AppService,
  ],
})
export class AppModule {}
