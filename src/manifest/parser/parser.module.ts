import { Signer } from '@ethersproject/abstract-signer';
import { Module } from '@nestjs/common';
import { ExecutionService } from 'ethereum/execution';
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
    ExecutionService,
    {
      provide: Signer,
      useFactory(
        walletService: WalletService,
        providerService: ExecutionService,
      ) {
        return walletService.wallet.connect(providerService.provider);
      },
      inject: [WalletService, ExecutionService],
    },
  ],
  exports: [ParserService],
})
export class ParserModule {}
