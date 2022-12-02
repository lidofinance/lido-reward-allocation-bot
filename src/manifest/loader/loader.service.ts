import { promise as glob } from 'glob-promise';
import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { readFile } from 'fs/promises';
import { ManifestParsed, ParserService } from 'manifest/parser';
import { MANIFEST_DIR } from './loader.constants';
import { ExecutionService } from 'ethereum/execution';

@Injectable()
export class LoaderService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private logger: LoggerService,
    private parserService: ParserService,
    private providerService: ExecutionService,
  ) {}

  /**
   * Loads manifests from files
   * @returns array of manifests
   */
  public async loadManifests(): Promise<ManifestParsed[]> {
    try {
      const network = await this.providerService.getNetworkName();
      this.logger.log('Network detected', { network });

      const filesPaths = await this.getFilePaths(network);
      if (filesPaths.length) {
        this.logger.log('Manifests found', { network, filesPaths });
      } else {
        this.logger.error('Manifests not found', { network });
        process.exit(1);
      }

      return await this.parseManifests(filesPaths);
    } catch (error) {
      this.logger.error(error);
      process.exit(1);
    }
  }

  /**
   * Parses manifest files
   * @param filesPaths array of paths
   * @returns array of parsed JSON objects
   */
  public async parseManifests(filesPaths: string[]): Promise<ManifestParsed[]> {
    return await Promise.all(
      filesPaths.map(async (filesPath) => {
        this.logger.log('Loading manifest', { filesPath });
        const content = await readFile(filesPath);

        return this.parserService.parseJSON(String(content));
      }),
    );
  }

  /**
   * Returns manifest file paths
   */
  public async getFilePaths(network: string): Promise<string[]> {
    return await glob(`${MANIFEST_DIR}/${network}/*.json`);
  }
}
