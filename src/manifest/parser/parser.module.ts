import { Module } from '@nestjs/common';
import { ProviderService, RpcBatchProvider } from 'ethereum/provider';
import { ParserAutomationService } from './parser-automation.service';
import { ParserMetricsService } from './parser-metric.service';
import { ParserRequestService } from './parser-request.service';
import { ParserService } from './parser.service';

@Module({
  providers: [
    ParserService,
    ParserMetricsService,
    ParserRequestService,
    ParserAutomationService,
    {
      provide: RpcBatchProvider,
      useFactory(providerService: ProviderService) {
        return providerService.getNewBatchProviderInstance();
      },
      inject: [ProviderService],
    },
  ],
  exports: [ParserService],
})
export class ParserModule {}
