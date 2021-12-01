import { Gauge } from 'prom-client';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { ContractTransaction } from '@ethersproject/contracts';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { ConfigService } from 'common/config';
import { METRIC_TRANSACTION_COUNTER } from 'common/prometheus';
import { TransactionStored, TransactionStatus } from './interfaces';
import { WAIT_BLOCKS_NUMBER } from './transaction.constants';

@Injectable()
export class TransactionService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private logger: LoggerService,

    @InjectMetric(METRIC_TRANSACTION_COUNTER)
    private transactionCount: Gauge<string>,

    private configService: ConfigService,
  ) {}

  private txStorage: Record<string, TransactionStored> = {};

  /**
   * Tracks transaction confirmation
   * @param txKey storage tx key
   * @param txRaw ContractTransaction object
   */
  public trackTransaction(txKey: string, txRaw: ContractTransaction) {
    const status: TransactionStatus = TransactionStatus.pending;
    const { hash, nonce } = txRaw;

    this.setToStorage(txKey, { status, hash, nonce });
    this.handleConfirmation(txKey, txRaw);
  }

  /**
   * Tracks transaction error
   * @param txKey storage tx key
   * @param txRaw ContractTransaction object
   */
  public trackError(txKey: string): void {
    const status = TransactionStatus.error;

    this.setToStorage(txKey, { status });
    this.handleError(txKey);
  }

  /**
   * Gets transaction object from storage by key
   * @param txKey storage tx key
   * @returns stored transaction object
   */
  public getFromStorage(txKey: string): TransactionStored | null {
    return this.txStorage[txKey] ?? null;
  }

  /**
   * Removes transaction object from storage by key
   * @param txKey storage tx key
   */
  public removeFromStorage(txKey: string): void {
    if (this.txStorage[txKey] != null) {
      delete this.txStorage[txKey];
    }
  }

  /**
   * Puts transaction object to storage by key
   * @param txKey storage tx key
   * @param tx partial stored transaction object
   */
  public setToStorage(txKey: string, tx: TransactionStored) {
    this.txStorage[txKey] = tx;
  }

  /**
   * Updates transaction object in storage
   * @param txKey storage tx key
   * @param tx stored transaction object
   */
  public updateInStorageIfExist(txKey: string, tx: TransactionStored) {
    const txStored = this.getFromStorage(txKey);
    if (!txStored) return;

    this.txStorage[txKey] = { ...txStored, ...tx };
  }

  /**
   * Sets status for stored transaction
   * @param txKey storage tx key
   * @param status transaction status
   */
  public setStatus(txKey: string, status: TransactionStatus): void {
    this.updateInStorageIfExist(txKey, { status });
  }

  /**
   * Handles transaction confirmation
   * @param txKey storage tx key
   * @param tx contract transaction object
   */
  public async handleConfirmation(
    txKey: string,
    tx: ContractTransaction,
  ): Promise<void> {
    const { hash, nonce } = tx;
    const txMeta = { hash, nonce };

    this.transactionCount.inc({ status: TransactionStatus.pending });

    this.logger.warn(
      'Transaction sent, waiting for block confirmation',
      txMeta,
    );

    const resubmitTimeoutSeconds = this.configService.get(
      'RESUBMIT_TX_TIMEOUT_SECONDS',
      { infer: true },
    );

    const timeoutTimer = setTimeout(() => {
      this.setStatus(txKey, TransactionStatus.timeout);
    }, resubmitTimeoutSeconds * 1000);

    try {
      const { blockNumber, blockHash } = await tx.wait(WAIT_BLOCKS_NUMBER);
      const blockMeta = { blockNumber, blockHash };

      this.transactionCount.inc({ status: TransactionStatus.confirmed });
      this.logger.warn('Block confirmation received', blockMeta);
    } catch (error) {
      this.transactionCount.inc({ status: TransactionStatus.error });
      this.logger.error(error);
    } finally {
      this.transactionCount.dec({ status: TransactionStatus.pending });
      clearTimeout(timeoutTimer);
      this.removeFromStorage(txKey);
    }
  }

  /**
   * Handles transaction error
   * @param txKey storage tx key
   */
  public async handleError(txKey: string): Promise<void> {
    this.transactionCount.labels({ status: TransactionStatus.error }).inc();

    const errorTimeoutSeconds = this.configService.get(
      'ERROR_TX_TIMEOUT_SECONDS',
      { infer: true },
    );

    setTimeout(() => {
      this.removeFromStorage(txKey);
    }, errorTimeoutSeconds * 1000);
  }
}
