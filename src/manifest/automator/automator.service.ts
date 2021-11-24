import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { ParserService } from 'manifest/parser';
import { ProviderService } from 'ethereum/provider';

@Injectable()
export class AutomatorService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private logger: LoggerService,
    private parserService: ParserService,
    private providerService: ProviderService,
  ) {}
}
