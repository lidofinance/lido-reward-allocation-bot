import { Histogram } from 'prom-client';
import { Injectable, NestMiddleware } from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Request, Reply } from './interfaces';
import { METRIC_HTTP_REQUEST_DURATION } from 'common/prometheus';

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  constructor(
    @InjectMetric(METRIC_HTTP_REQUEST_DURATION)
    private duration: Histogram<string>,
  ) {}

  use(request: Request, reply: Reply, next: () => void) {
    const { method, originalUrl, headers } = request;
    const { pathname } = new URL(originalUrl, `http://${headers.host}`);

    const endTimer = this.duration.startTimer({ method, pathname });

    reply.on('finish', () => {
      const { statusCode } = reply;
      endTimer({ statusCode });
    });

    next();
  }
}
