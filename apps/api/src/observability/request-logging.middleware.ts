import { Injectable, type NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { NextFunction, Request, Response } from 'express';
import { MetricsService } from './metrics.service';
import { getUserId, setRequestId } from './request-context';
import { StructuredLoggerService } from './structured-logger.service';

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  constructor(
    private readonly metricsService: MetricsService,
    private readonly structuredLogger: StructuredLoggerService,
  ) {}

  use(request: Request, response: Response, next: NextFunction) {
    const requestId = randomUUID();
    const startedAt = process.hrtime.bigint();

    setRequestId(request, requestId);
    response.setHeader('x-request-id', requestId);

    response.on('finish', () => {
      this.metricsService.incrementTotalRequests();
      const elapsedMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;

      this.structuredLogger.info('request.completed', {
        request_id: requestId,
        method: request.method,
        path: request.originalUrl || request.url,
        status_code: response.statusCode,
        response_time_ms: Number(elapsedMs.toFixed(2)),
        principal_id: request.principal_id || getUserId(request),
        user_agent: request.get('user-agent'),
        ip: request.ip,
      });
    });

    next();
  }
}
