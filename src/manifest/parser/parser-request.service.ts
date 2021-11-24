import { FormatTypes, Interface } from '@ethersproject/abi';
import { Contract } from '@ethersproject/contracts';
import { Signer } from '@ethersproject/abstract-signer';
import { Provider } from '@ethersproject/providers';
import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { RpcBatchProvider } from 'ethereum/provider';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import {
  ContractMethodCall,
  ContractMethodCallCommon,
  ContractMethodSignedCall,
  MetricRawRequest,
  MetricRequestPayload,
} from 'manifest/parser';
import { WalletService } from 'ethereum/wallet';

@Injectable()
export class ParserRequestService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private logger: LoggerService,

    private batchProvider: RpcBatchProvider,
    private walletService: WalletService,
  ) {}

  /**
   * Parses request object from manifest
   * @param request raw request object
   * @returns request function
   */
  public parseRequest(request: MetricRawRequest) {
    switch (request.type) {
      case 'contractMethodCall':
        return this.getContractMethodCall(request);
      case 'contractMethodSignedCall':
        return this.getContractMethodSignedCall(request);
      default:
    }

    this.logger.error('Metric request is not supported', { request });
    process.exit(1);
  }

  /**
   * Parses ContractMethodCall request object from manifest
   * @param request raw request object
   * @returns function calling contract method
   */
  public getContractMethodCallCommon(
    request: ContractMethodCallCommon,
    provider: Provider | Signer,
  ) {
    const { address, method, args = [] } = request;

    const iface = new Interface([method]);
    const abi = iface.format(FormatTypes.json);
    const methodName = iface.fragments[0].name;

    const contract = new Contract(address, abi, provider);

    return async (payload?: MetricRequestPayload) => {
      const { overrides = {} } = payload;
      return await contract[methodName](...args, overrides);
    };
  }

  /**
   * Parses ContractMethodCall request object from manifest
   * @param request raw request object
   * @returns function calling contract method
   */
  public getContractMethodCall(request: ContractMethodCall) {
    return this.getContractMethodCallCommon(request, this.batchProvider);
  }

  /**
   * Parses ContractMethodSignedCall request object from manifest
   * @param request raw request object
   * @returns function calling contract method
   */
  public getContractMethodSignedCall(request: ContractMethodSignedCall) {
    return this.getContractMethodCallCommon(request, this.walletService.wallet);
  }
}
