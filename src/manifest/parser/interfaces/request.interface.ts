import { CallOverrides } from 'ethereum/provider';

export type MetricRequestRaw = ContractMethodCall | ContractMethodSignedCall;

export type MetricRequestResult = number | void;

export interface ContractMethodCallCommon {
  address: string;
  method: string;
  args?: unknown[];
}

export interface ContractMethodCall extends ContractMethodCallCommon {
  type: 'contractMethodCall';
}

export interface ContractMethodSignedCall extends ContractMethodCallCommon {
  type: 'contractMethodSignedCall';
}

export type MetricRequest<T extends unknown = unknown> = (
  payload?: MetricRequestPayload,
) => Promise<T>;

export interface MetricRequestPayload {
  overrides?: CallOverrides;
}
