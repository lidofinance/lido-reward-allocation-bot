import { Gauge } from 'prom-client';
import {
  Inject,
  Injectable,
  LoggerService,
  OnModuleInit,
} from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { METRIC_BUILD_INFO } from 'common/prometheus';
import { LoaderService } from 'manifest/loader';
import { WalletService } from 'ethereum/wallet';
import { APP_NAME, APP_VERSION } from './app.constants';
import { ConfigService } from 'common/config';
import { ExecutionService } from 'ethereum/execution/execution.service';

@Injectable()
export class AppService implements OnModuleInit {
  constructor(
    @InjectMetric(METRIC_BUILD_INFO)
    private buildInfo: Gauge<string>,

    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private logger: LoggerService,

    private loaderService: LoaderService,
    private walletService: WalletService,
    private configService: ConfigService,
    private executorService: ExecutionService
  ) {}

  async onModuleInit(): Promise<void> {
    const address = this.walletService.address;
    const network = await this.executorService.getNetworkName();
    const env = this.configService.get('NODE_ENV', { infer: true });
    const version = APP_VERSION;
    const name = APP_NAME;

    this.buildInfo.labels({ env, network, address, name, version }).inc();
    this.logger.log('Init app', { env, network, address, name, version });

    const manifests = await this.loaderService.loadManifests();

    this.executorService.handleNewBlock(manifests);
  }
}
