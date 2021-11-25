export interface TransactionStored {
  status: TransactionStatus;
  nonce?: number;
  hash?: string;
}

export enum TransactionStatus {
  pending = 'pending',
  timeout = 'timeout',
  error = 'error',
}
