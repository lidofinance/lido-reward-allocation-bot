import {
  JsonRpcBatchProvider,
  JsonRpcProvider,
  StaticJsonRpcProvider,
} from '@ethersproject/providers';
import { getNetwork } from '@ethersproject/networks';
import { CHAINS } from '@lido-sdk/constants';
import { DynamicModule, Module } from '@nestjs/common';
import { ConfigService } from 'common/config';
import { RpcBatchProvider, RpcProvider } from './interfaces';
import { ProviderService } from './provider.service';

const getProviderFactory = (SourceProvider: typeof JsonRpcProvider) => {
  return async (configService: ConfigService): Promise<RpcProvider> => {
    const rpcUrl = configService.get('RPC_URL', { infer: true });

    class Provider extends SourceProvider {
      async _uncachedDetectNetwork() {
        return getNetwork(CHAINS.Goerli);
      }

      clone() {
        return new Provider(rpcUrl);
      }
    }

    return new Provider(rpcUrl);
  };
};

@Module({})
export class MockProviderModule {
  static forRoot(): DynamicModule {
    return {
      module: MockProviderModule,
      global: true,
      providers: [
        ProviderService,
        {
          provide: RpcProvider,
          useFactory: getProviderFactory(StaticJsonRpcProvider),
          inject: [ConfigService],
        },
        {
          provide: RpcBatchProvider,
          useFactory: getProviderFactory(JsonRpcBatchProvider),
          inject: [ConfigService],
        },
      ],
      exports: [ProviderService, RpcProvider, RpcBatchProvider],
    };
  }
}
