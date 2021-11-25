import { Signer } from '@ethersproject/abstract-signer';
import { FormatTypes, Interface } from '@ethersproject/abi';
import { Provider } from '@ethersproject/providers';
import { Contract } from '@ethersproject/contracts';
import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { RpcBatchProvider } from 'ethereum/provider';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import {
  ContractMethodCall,
  ContractMethodSignedCall,
  MetricRequestRaw,
  MetricRequestPayload,
  ContractMethodCallCommon,
} from 'manifest/parser';

@Injectable()
export class ParserRequestService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private logger: LoggerService,

    private provider: RpcBatchProvider,
    private signer: Signer,
  ) {}

  /**
   * Parses request object from manifest
   * @param request raw request object
   * @returns request function
   */
  public parseRequest(request: MetricRequestRaw) {
    if (request.type === 'contractMethodCall') {
      return this.getContractMethodCall(request);
    }

    if (request.type === 'contractMethodSignedCall') {
      return this.getContractMethodSignedCall(request);
    }

    this.logger.error('Metric request is not supported', { request });
    process.exit(1);
  }

  /**
   * Parses ContractMethodCall request object from manifest
   * @param request raw request object
   * @returns function calling contract method
   */
  public getContractMethodCall(request: ContractMethodCall) {
    return this.getContractMethodCallCommon(request, this.provider);
  }

  /**
   * Parses ContractMethodSignedCall request object from manifest
   * @param request raw request object
   * @returns function calling contract method
   */
  public getContractMethodSignedCall(request: ContractMethodSignedCall) {
    return this.getContractMethodCallCommon(request, this.signer);
  }

  /**
   * Parses request object from manifest
   * @param request raw request object
   * @param provider Provider or Signer
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

    return async ({ overrides }: MetricRequestPayload = {}) => {
      return await contract[methodName](...args, overrides ?? {});
    };
  }
}
