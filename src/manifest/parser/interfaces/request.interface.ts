import { CallOverrides } from 'ethereum/provider';

export type MetricRawRequest = ContractMethodCall | ContractMethodSignedCall;

export interface ContractMethodCallCommon {
  address: string;
  method: string;
  args?: any[];
}

export interface ContractMethodCall extends ContractMethodCallCommon {
  type: 'contractMethodCall';
}

export interface ContractMethodSignedCall extends ContractMethodCallCommon {
  type: 'contractMethodSignedCall';
}

export type MetricRequest<T> = (payload?: MetricRequestPayload) => Promise<T>;

export interface MetricRequestPayload {
  overrides?: CallOverrides;
}
