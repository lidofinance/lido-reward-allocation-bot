import { FormatTypes, Interface } from '@ethersproject/abi';
import { Contract } from '@ethersproject/contracts';
import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { RpcBatchProvider } from 'ethereum/provider';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import {
  ContractMethodCall,
  MetricRawRequest,
  MetricRequestPayload,
} from 'manifest/parser';

@Injectable()
export class ParserRequestService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private logger: LoggerService,

    private batchProvider: RpcBatchProvider,
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
      default:
    }

    this.logger.error('Metric request is not supported', { request });
    process.exit(1);
  }

  /**
   * Parses ContractMethodCall request object from manifest
   * @param request raw ContractMethodCall request
   * @returns function calling contract method
   */
  public getContractMethodCall(request: ContractMethodCall) {
    const { address, method, args = [] } = request;

    const iface = new Interface([method]);
    const abi = iface.format(FormatTypes.json);
    const methodName = iface.fragments[0].name;

    const contract = new Contract(address, abi, this.batchProvider);

    return async (payload?: MetricRequestPayload) => {
      const { overrides = {} } = payload;
      return await contract[methodName](...args, overrides);
    };
  }
}
