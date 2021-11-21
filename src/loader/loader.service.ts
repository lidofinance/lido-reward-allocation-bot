import { promise as glob } from 'glob-promise';
import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { readFile } from 'fs/promises';
import { Manifest, ParserService } from 'parser';
import { ProviderService } from 'provider';
import { CHAINS } from '@lido-sdk/constants';

@Injectable()
export class LoaderService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private logger: LoggerService,
    private parserService: ParserService,
    private providerService: ProviderService,
  ) {}

  async getFileNames(network: string): Promise<string[]> {
    return await glob(`manifests/${network}/*.json`);
  }

  async getNetworkName(): Promise<string> {
    const network = await this.providerService.provider.getNetwork();
    const name = CHAINS[network.chainId]?.toLocaleLowerCase();
    return name || network.name;
  }

  async parseFiles(filesPaths: string[]): Promise<Manifest[]> {
    return await Promise.all(
      filesPaths.map(async (filesPath) => {
        this.logger.log('Loading manifest', { filesPath });
        const content = await readFile(filesPath);

        return this.parserService.parseJSON(String(content));
      }),
    );
  }

  async loadManifests(): Promise<Manifest[]> {
    try {
      const network = await this.getNetworkName();
      this.logger.log('Network detected', { network });

      const filesPaths = await this.getFileNames(network);
      if (filesPaths.length) {
        this.logger.log('Manifests found', { network, filesPaths });
      } else {
        this.logger.error('Manifests not found', { network });
        process.exit(1);
      }

      return await this.parseFiles(filesPaths);
    } catch (error) {
      this.logger.error(error);
      process.exit(1);
    }
  }
}
