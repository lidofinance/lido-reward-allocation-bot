import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { SimpleFallbackJsonRpcBatchProvider } from '@lido-nestjs/execution';
import { Block } from '@ethersproject/abstract-provider';
import { OneAtTime } from 'common/decorators';
import { ManifestParsed } from 'manifest/parser';
import { ProcessorService } from 'manifest/processor';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { CHAINS } from '@lido-sdk/constants';
import { EventType, Listener } from '@ethersproject/abstract-provider';

@Injectable()
export class ExecutionService {
    constructor(
        @Inject(WINSTON_MODULE_NEST_PROVIDER)
        private logger: LoggerService,
        private processorService: ProcessorService,

        // Исходя из мысли, что теперь ф-ия clone не нужна совсем, то и интерейфс, который использовльзовался для расширения базового 
        // класса методом clone - тоже не нужен.
        public provider: SimpleFallbackJsonRpcBatchProvider,
    ) { }

    /**
     * Returns current block
     */
    public async getBlock(): Promise<Block> {
        return await this.provider.getBlock('latest');
    }

    /**
     * Handles the appearance of a new block in the network
     */
    @OneAtTime()
    async handleNewBlock(manifests: ManifestParsed[]): Promise<void> {
        try {
            const block = await this.getBlock();

            await Promise.all(
                manifests.map((program) => {
                    this.processorService.processManifest(program, block);
                }),
            );
        } catch (error) {
            this.logger.error(error);
        }
    }

    /**
   * Returns network name
   */
    public async getNetworkName(): Promise<string> {
        const network = await this.provider.getNetwork();
        const name = CHAINS[network.chainId]?.toLocaleLowerCase();
        return name || network.name;
    }

    /**
     * Returns current block number
     */
    public async getBlockNumber(): Promise<number> {
        const cachedBlockNumber = this.provider.blockNumber;

        return cachedBlockNumber === -1
            ? await this.provider.getBlockNumber()
            : cachedBlockNumber;
    }

    /**
     * Returns current chain id
     */
    public async getChainId(): Promise<number> {
        const { chainId } = await this.provider.getNetwork();
        return chainId;
    }

    // Сделать по-другогму
    // залогировать, упасть.
    on(eventName: EventType, listener: Listener): this {
        return this;
    }
}