import { APP_INTERCEPTOR } from '@nestjs/core';
import { Module } from '@nestjs/common';

import { PrometheusModule } from 'common/prometheus';
import { LoggerModule } from 'common/logger';
import { ConfigModule } from 'common/config';
import { SentryInterceptor } from 'common/sentry';
import { HealthModule } from 'common/health';
import { AppService } from 'app.service';
import { LoaderModule } from 'loader';
import { ProviderModule } from 'provider';

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
