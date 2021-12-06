import { Signer } from '@ethersproject/abstract-signer';
import { FormatTypes, Interface } from '@ethersproject/abi';
import { Provider } from '@ethersproject/providers';
import { Contract } from '@ethersproject/contracts';
import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { RpcBatchProvider } from 'ethereum/provider';
import { TransactionService, TransactionStatus } from 'ethereum/transaction';
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
    private transactionService: TransactionService,
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
    const method = this.getContractMethod(request, this.provider);

    return async ({ overrides = {} }: MetricRequestPayload = {}) => {
      return await method(overrides);
    };
  }

  /**
   * Parses ContractMethodSignedCall request object from manifest
   * @param request raw request object
   * @returns function calling contract method
   */
  public getContractMethodSignedCall(request: ContractMethodSignedCall) {
    const method = this.getContractMethod(request, this.signer);
    const txKey = `${request.address}-${request.method}`;

    return async ({ overrides = {} }: MetricRequestPayload = {}) => {
      const storedTx = this.transactionService.getFromStorage(txKey);

      if (
        storedTx?.status === TransactionStatus.error ||
        storedTx?.status === TransactionStatus.pending
      ) {
        this.logger.debug?.('Transaction sent earlier, waiting', storedTx);
        return;
      }

      if (storedTx?.status === TransactionStatus.timeout) {
        this.logger.log('Transaction is outdated, resending', storedTx);
        overrides = { ...overrides, nonce: storedTx.nonce };
      }

      try {
        const tx = await method(overrides);
        this.transactionService.trackTransaction(txKey, tx);
      } catch (error) {
        this.transactionService.trackError(txKey);
        throw error;
      }
    };
  }

  /**
   * Returns contract method handler
   * @param request raw request object
   * @param provider Provider or Signer
   * @returns function calling contract method
   */
  public getContractMethod(
    request: ContractMethodCallCommon,
    provider: Provider | Signer,
  ) {
    const { address, method, args = [] } = request;

    const iface = new Interface([method]);
    const abi = iface.format(FormatTypes.json);
    const methodName = iface.fragments[0].name;

    const contract = new Contract(address, abi, provider);

    return contract[methodName].bind(contract, ...args);
  }
}
