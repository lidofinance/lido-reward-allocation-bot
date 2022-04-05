import { Wallet } from '@ethersproject/wallet';
import { LoggerService } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { PrometheusModule } from 'common/prometheus';
import { ConfigModule } from 'common/config';
import { LoggerModule } from 'common/logger';
import { MockProviderModule } from 'ethereum/provider';
import { WalletModule } from 'ethereum/wallet';
import { WALLET_PRIVATE_KEY } from './wallet.constants';
import { WalletService } from './wallet.service';
import { ExecutionService } from 'ethereum/execution';

describe('WalletService', () => {
  const wallet = Wallet.createRandom();
  let walletService: WalletService;
  let providerService: ExecutionService;
  let loggerService: LoggerService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        MockProviderModule.forRoot(),
        ConfigModule,
        LoggerModule,
        PrometheusModule,
        WalletModule,
      ],
    })
      .overrideProvider(WALLET_PRIVATE_KEY)
      .useValue(wallet.privateKey)
      .compile();

    walletService = moduleRef.get(WalletService);
    providerService = moduleRef.get(ExecutionService);
    loggerService = moduleRef.get(WINSTON_MODULE_NEST_PROVIDER);

    jest.spyOn(loggerService, 'log').mockImplementation(() => undefined);
  });

  describe('subscribeToEthereumUpdates', () => {
    it('should subscribe to updates', () => {
      const mockOn = jest
        .spyOn(providerService.provider, 'on')
        .mockImplementation(() => undefined as any);

      walletService.subscribeToEthereumUpdates();
      expect(mockOn).toBeCalledTimes(1);
      expect(mockOn).toBeCalledWith('block', expect.any(Function));
    });
  });

  describe('wallet', () => {
    it('should return a wallet', async () => {
      expect(walletService.wallet).toBeInstanceOf(Wallet);
    });

    it('should cache instance', async () => {
      expect(walletService.wallet).toBe(walletService.wallet);
    });
  });

  describe('address', () => {
    it('should return correct address', async () => {
      expect(walletService.address).toBe(wallet.address);
    });
  });
});
