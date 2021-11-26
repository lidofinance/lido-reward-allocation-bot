import { Module } from '@nestjs/common';
import { ParserModule } from 'manifest/parser';
import { ProcessorService } from './processor.service';

@Module({
  imports: [ParserModule],
  providers: [ProcessorService],
  exports: [ProcessorService],
})
export class ProcessorModule {}
