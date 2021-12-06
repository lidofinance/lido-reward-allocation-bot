import { Gauge } from 'prom-client';
import {
  Inject,
  Injectable,
  LoggerService,
  OnModuleInit,
} from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { OneAtTime } from 'common/decorators';
import { METRIC_BUILD_INFO } from 'common/prometheus';
import { LoaderService } from 'manifest/loader';
import { ManifestParsed } from 'manifest/parser';
import { ProcessorService } from 'manifest/processor';
import { ProviderService } from 'ethereum/provider';
import { WalletService } from 'ethereum/wallet';
import { APP_NAME, APP_VERSION } from './app.constants';
import { ConfigService } from 'common/config';

@Injectable()
export class AppService implements OnModuleInit {
  constructor(
    @InjectMetric(METRIC_BUILD_INFO)
    private buildInfo: Gauge<string>,

    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private logger: LoggerService,

    private loaderService: LoaderService,
    private providerService: ProviderService,
    private processorService: ProcessorService,
    private walletService: WalletService,
    private configService: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    const address = this.walletService.address;
    const network = await this.providerService.getNetworkName();
    const env = this.configService.get('NODE_ENV', { infer: true });
    const version = APP_VERSION;
    const name = APP_NAME;

    this.buildInfo.labels({ env, network, address, name, version }).inc();
    this.logger.log('Init app', { env, network, address, name, version });

    const manifests = await this.loaderService.loadManifests();

    this.providerService.provider.on('block', () => {
      this.handleNewBlock(manifests);
    });
  }

  /**
   * Handles the appearance of a new block in the network
   */
  @OneAtTime()
  async handleNewBlock(manifests: ManifestParsed[]): Promise<void> {
    try {
      const block = await this.providerService.getBlock();

      await Promise.all(
        manifests.map((program) => {
          this.processorService.processManifest(program, block);
        }),
      );
    } catch (error) {
      this.logger.error(error);
    }
  }
}
