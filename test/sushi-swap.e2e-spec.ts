import { CHAINS } from '@lido-sdk/constants';
import { LoggerService } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { PrometheusModule } from '../src/common/prometheus';
import { LoggerModule } from '../src/common/logger';
import { ConfigModule, ConfigService } from '../src/common/config';
import {
  ProviderService,
  GanacheProviderModule,
} from '../src/ethereum/provider';
import { LoaderService, LoaderModule } from '../src/manifest/loader';
import { ProcessorService, ProcessorModule } from '../src/manifest/processor';
import { Block } from '@ethersproject/abstract-provider';

const MANIFESTS_DIR = `${__dirname}/../manifests/mainnet/`;
const MANIFESTS_FILE = `sushi-swap.json`;

describe('Sushi swap', () => {
  let configService: ConfigService;
  let providerService: ProviderService;
  let loaderService: LoaderService;
  let processorService: ProcessorService;
  let loggerService: LoggerService;

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
    loggerService = moduleRef.get(WINSTON_MODULE_NEST_PROVIDER);

    // jest.spyOn(loggerService, 'log').mockImplementation(() => undefined);
    jest.spyOn(loggerService, 'warn').mockImplementation(() => undefined);
    jest.spyOn(loggerService, 'debug').mockImplementation(() => undefined);
  });

  describe('global checks', () => {
    it('should work on mainnet', async () => {
      const chainId = await providerService.getChainId();
      expect(chainId).toBe(CHAINS.Mainnet);
    }, 10_000);
  });

  describe('should start new period', () => {
    const path = `${MANIFESTS_DIR}${MANIFESTS_FILE}`;
    let manifest: any;
    let currentBlock: Block;
    let currentMetrics: Record<string, any>;

    it('should parse manifest', async () => {
      currentBlock = await providerService.getBlock();
      manifest = (await loaderService.parseManifests([path]))[0];

      expect(manifest).toEqual(expect.any(Object));
      expect(currentBlock).toEqual(
        expect.objectContaining({
          number: expect.any(Number),
          timestamp: expect.any(Number),
        }),
      );
    }, 10_000);

    it('should collect metrics', async () => {
      currentMetrics = await processorService.collectMetrics(
        manifest,
        currentBlock,
      );

      expect(currentMetrics).toEqual(
        expect.objectContaining({
          isPeriodFinished: false,
          periodFinishUnix: expect.any(String),
        }),
      );
    }, 10_000);

    it('should fast forward to the end of reward period', async () => {
      const finishTimeUnix = Number(currentMetrics.periodFinishUnix);
      await providerService.provider.send('evm_mine', [finishTimeUnix]);

      const futureBlock = await providerService.getBlock();
      const futureMetrics = await processorService.collectMetrics(
        manifest,
        futureBlock,
      );

      expect(futureBlock.timestamp).toBe(finishTimeUnix);
      expect(futureMetrics).toEqual(
        expect.objectContaining({
          isPeriodFinished: true,
        }),
      );
    }, 10_000);
  });
});
