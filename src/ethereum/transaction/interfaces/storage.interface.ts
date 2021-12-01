export interface TransactionStored {
  status: TransactionStatus;
  nonce?: number;
  hash?: string;
}

export enum TransactionStatus {
  confirmed = 'confirmed',
  pending = 'pending',
  timeout = 'timeout',
  error = 'error',
}
