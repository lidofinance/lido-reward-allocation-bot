import {
  Inject,
  Injectable,
  LoggerService,
  OnModuleInit,
} from '@nestjs/common';
import { OneAtTime } from 'common/decorators';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { LoaderService } from 'manifest/loader';
import { ManifestParsed } from 'manifest/parser';
import { ProcessorService } from 'manifest/processor';
import { ProviderService } from 'ethereum/provider';

@Injectable()
export class AppService implements OnModuleInit {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private logger: LoggerService,

    private loaderService: LoaderService,
    private providerService: ProviderService,
    private processorService: ProcessorService,
  ) {}

  async onModuleInit(): Promise<void> {
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
