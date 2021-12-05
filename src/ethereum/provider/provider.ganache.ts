import { provider } from 'ganache';
import { Formatter, Web3Provider } from '@ethersproject/providers';
import { DynamicModule, Module } from '@nestjs/common';
import { CHAINS } from '@lido-sdk/constants';
import { ConfigService } from 'common/config';
import { RpcBatchProvider, RpcProvider } from './interfaces';
import { ProviderService } from './provider.service';

const getProviderFactory = () => {
  return async (configService: ConfigService): Promise<RpcProvider> => {
    const rpcUrl = configService.get('RPC_URL', { infer: true });

    const options = {
      chainId: CHAINS.Mainnet,
      chainIdRpc: CHAINS.Mainnet,
      networkId: CHAINS.Mainnet,
      fork: rpcUrl,
    };

    class FormatterGanache extends Formatter {
      blockTag(blockTag: any): any {
        if (
          typeof blockTag === 'object' &&
          blockTag != null &&
          ('blockNumber' in blockTag || 'blockHash' in blockTag)
        ) {
          return 'latest';
        }

        return super.blockTag(blockTag);
      }
    }

    class Provider extends Web3Provider {
      static _formatter: Formatter | null = null;

      static getFormatter(): Formatter {
        if (this._formatter == null) {
          this._formatter = new FormatterGanache();
        }
        return this._formatter;
      }

      clone() {
        return new Provider(provider(options));
      }
    }

    return new Provider(provider(options));
  };
};

@Module({})
export class GanacheProviderModule {
  static forRoot(): DynamicModule {
    return {
      module: GanacheProviderModule,
      global: true,
      providers: [
        ProviderService,
        {
          provide: RpcProvider,
          useFactory: getProviderFactory(),
          inject: [ConfigService],
        },
        {
          provide: RpcBatchProvider,
          useFactory: getProviderFactory(),
          inject: [ConfigService],
        },
      ],
      exports: [ProviderService, RpcProvider, RpcBatchProvider],
    };
  }
}
