import { Module } from '@nestjs/common';
import { ExecutionService } from 'ethereum/execution/execution.service';
import { ParserModule } from 'manifest/parser';

@Module({
  imports: [ParserModule],
  providers: [ExecutionService],
  exports: [ExecutionService],
})
export class ProcessorModule {}
