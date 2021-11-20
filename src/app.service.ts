import { Injectable, OnModuleInit } from '@nestjs/common';
import { LoaderService } from 'loader';

@Injectable()
export class AppService implements OnModuleInit {
  constructor(private loaderService: LoaderService) {}

  async onModuleInit() {
    const programs = await this.loaderService.load();
  }
}
