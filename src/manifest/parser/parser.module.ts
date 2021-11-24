import { Signer } from '@ethersproject/abstract-signer';
import { Module } from '@nestjs/common';
import { ProviderService, RpcBatchProvider } from 'ethereum/provider';
import { WalletModule, WalletService } from 'ethereum/wallet';
import { ParserAutomationService } from './parser-automation.service';
import { ParserMetricsService } from './parser-metric.service';
import { ParserRequestService } from './parser-request.service';
import { ParserService } from './parser.service';

@Module({
  imports: [WalletModule],
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
    {
      provide: Signer,
      useFactory(
        walletService: WalletService,
        providerService: ProviderService,
      ) {
        return walletService.wallet.connect(providerService.provider);
      },
      inject: [WalletService, ProviderService],
    },
  ],
  exports: [ParserService],
})
export class ParserModule {}
