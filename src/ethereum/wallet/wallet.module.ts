import { Module } from '@nestjs/common';
import { ConfigService } from 'common/config';
import { WALLET_PRIVATE_KEY } from './wallet.constants';
import { WalletService } from './wallet.service';

@Module({
  providers: [
    WalletService,
    {
      provide: WALLET_PRIVATE_KEY,
      useFactory: async (configService: ConfigService) => {
        return configService.get('WALLET_PRIVATE_KEY', { infer: true });
      },
      inject: [ConfigService],
    },
  ],
  exports: [WalletService],
})
export class WalletModule {}
