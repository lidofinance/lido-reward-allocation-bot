import { Signer } from '@ethersproject/abstract-signer';
import { Module } from '@nestjs/common';
import { ProviderService, RpcBatchProvider } from 'ethereum/provider';
import { TransactionModule } from 'ethereum/transaction';
import { WalletModule, WalletService } from 'ethereum/wallet';
import { ParserMetricsService } from './parser-metric.service';
import { ParserRequestService } from './parser-request.service';
import { ParserService } from './parser.service';

@Module({
  imports: [WalletModule, TransactionModule],
  providers: [
    ParserService,
    ParserMetricsService,
    ParserRequestService,
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
