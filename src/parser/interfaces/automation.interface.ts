import { AutomationRequest } from './request.interface';

export interface RawAutomation {
  rules: Record<string, unknown>;
  request: AutomationRequest;
}

export interface Automation {}
