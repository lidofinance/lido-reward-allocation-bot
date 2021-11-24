import { Signer } from '@ethersproject/abstract-signer';
import { FormatTypes, Interface } from '@ethersproject/abi';
import { Contract } from '@ethersproject/contracts';
import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { RpcBatchProvider } from 'ethereum/provider';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import {
  ContractMethodCall,
  ContractMethodSignedCall,
  MetricRawRequest,
  MetricRequestPayload,
} from 'manifest/parser';

@Injectable()
export class ParserRequestService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private logger: LoggerService,

    private batchProvider: RpcBatchProvider,
    private signer: Signer,
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
  public getContractMethodCall(request: ContractMethodCall) {
    const { address, method, args = [] } = request;

    const iface = new Interface([method]);
    const abi = iface.format(FormatTypes.json);
    const methodName = iface.fragments[0].name;

    const contract = new Contract(address, abi, this.batchProvider);

    return async (payload: MetricRequestPayload = {}) => {
      const { overrides = {} } = payload;
      return await contract[methodName](...args, overrides);
    };
  }

  /**
   * Parses ContractMethodSignedCall request object from manifest
   * @param request raw request object
   * @returns function calling contract method
   */
  public getContractMethodSignedCall(request: ContractMethodSignedCall) {
    const { address, method, args = [] } = request;

    const iface = new Interface([method]);
    const abi = iface.format(FormatTypes.json);
    const methodName = iface.fragments[0].name;

    const contract = new Contract(address, abi, this.signer);

    return async (payload: MetricRequestPayload = {}) => {
      const { overrides = {} } = payload;
      const tx = await contract[methodName](...args, overrides);

      this.logger.warn('Transaction sent', { method, args, txHash: tx.hash });
      this.logger.warn('Waiting for block confirmation');

      await tx.wait();

      this.logger.warn('Block confirmation received');
    };
  }
}
