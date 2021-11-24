import { Module } from '@nestjs/common';
import { ParserModule } from 'manifest/parser';
import { AutomatorService } from './automator.service';

@Module({
  imports: [ParserModule],
  providers: [AutomatorService],
  exports: [AutomatorService],
})
export class AutomatorModule {}
