import { CHAINS } from '@lido-sdk/constants';
import { LoggerService } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { WeiPerEther } from '@ethersproject/constants';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { PrometheusModule } from '../src/common/prometheus';
import { LoggerModule } from '../src/common/logger';
import { ConfigModule, ConfigService } from '../src/common/config';
import {
  ProviderService,
  GanacheProviderModule,
  GANACHE_PORT,
} from '../src/ethereum/provider';
import { TransactionService } from '../src/ethereum/transaction';
import { WalletService } from '../src/ethereum/wallet';
import { LoaderService, LoaderModule } from '../src/manifest/loader';
import { ProcessorService, ProcessorModule } from '../src/manifest/processor';
import { Block } from '@ethersproject/abstract-provider';
import { ContractTransaction } from '@ethersproject/contracts';
import { startServer } from './server';

const MANIFESTS_DIR = `${__dirname}/../manifests/mainnet/`;
const MANIFESTS_FILE = `1inch-v2.json`;

const START_BLOCK = 13675709;

describe('1inch v2', () => {
  let configService: ConfigService;
  let providerService: ProviderService;
  let loaderService: LoaderService;
  let processorService: ProcessorService;
  let transactionService: TransactionService;
  let loggerService: LoggerService;
  let walletService: WalletService;
  let tx: ContractTransaction;
  let server: any;

  beforeAll(() => {
    server = startServer(START_BLOCK);
    server.listen(GANACHE_PORT);
  });

  afterAll(async () => {
    await server.close();
  });

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule,
        LoggerModule,
        PrometheusModule,
        ProcessorModule,
        GanacheProviderModule.forRoot(),
        LoaderModule,
      ],
    }).compile();

    configService = moduleRef.get(ConfigService);
    providerService = moduleRef.get(ProviderService);
    loaderService = moduleRef.get(LoaderService);
    processorService = moduleRef.get(ProcessorService);
    transactionService = moduleRef.get(TransactionService);
    walletService = moduleRef.get(WalletService);
    loggerService = moduleRef.get(WINSTON_MODULE_NEST_PROVIDER);

    jest
      .spyOn(transactionService, 'trackTransaction')
      .mockImplementation(async (_txKey, txRaw) => {
        tx = txRaw;
      });

    jest.spyOn(loggerService, 'log').mockImplementation(() => undefined);
    jest.spyOn(loggerService, 'warn').mockImplementation(() => undefined);
    jest.spyOn(loggerService, 'debug').mockImplementation(() => undefined);
  });

  describe('global checks', () => {
    it('should work on mainnet', async () => {
      const chainId = await providerService.getChainId();
      expect(chainId).toBe(CHAINS.Mainnet);
    });

    it('should have some eth', async () => {
      const provider = providerService.provider;
      const balance = await provider.getBalance(walletService.address);
      expect(balance.gte(WeiPerEther)).toBe(true);
    });

    it('should mining', async () => {
      const isMining = await providerService.provider.send('eth_mining', []);
      expect(isMining).toBe(true);
    });
  });

  describe('should start new period', () => {
    const path = `${MANIFESTS_DIR}${MANIFESTS_FILE}`;
    let manifest: any;
    let currentBlock: Block;
    let currentMetrics: Record<string, any>;

    it('should get start block', async () => {
      currentBlock = await providerService.getBlock();

      expect(currentBlock).toEqual(
        expect.objectContaining({ number: START_BLOCK + 1 }),
      );
    });

    it('should parse manifest', async () => {
      [manifest] = await loaderService.parseManifests([path]);

      expect(manifest).toEqual(expect.any(Object));
    });

    it('should be finished', async () => {
      currentMetrics = await processorService.collectMetrics(
        manifest,
        currentBlock,
      );

      expect(currentMetrics).toEqual(
        expect.objectContaining({ isPeriodFinished: true }),
      );
    });

    it('should start new period', async () => {
      await processorService.runAutomation(
        manifest,
        currentBlock,
        currentMetrics,
      );
      await tx.wait();

      const newMetrics = await processorService.collectMetrics(
        manifest,
        currentBlock,
      );

      expect(newMetrics).toEqual(
        expect.objectContaining({ isPeriodFinished: false }),
      );
    });
  });
});
