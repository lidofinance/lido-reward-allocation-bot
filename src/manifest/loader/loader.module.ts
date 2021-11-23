import { Module } from '@nestjs/common';
import { ParserModule } from 'manifest/parser';
import { LoaderService } from './loader.service';

@Module({
  imports: [ParserModule],
  providers: [LoaderService],
  exports: [LoaderService],
})
export class LoaderModule {}
