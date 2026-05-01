import { Injectable, Logger } from '@nestjs/common';
import type { Request } from 'express';
import { MetricsService } from '../observability/metrics.service';
import { StructuredLoggerService } from '../observability/structured-logger.service';

type RateLimitRecord = {
  count: number;
  resetAt: number;
  lastSeenAt: number;
};

type RateLimitDecision = {
  allowed: boolean;
  retryAfterSeconds: number;
};

@Injectable()
export class RedirectRateLimitService {
  private readonly buckets = new Map<string, RateLimitRecord>();
  private readonly maxRequests = this.parsePositiveInt(
    process.env.REDIRECT_RATE_LIMIT_MAX,
    60,
  );
  private readonly windowMs = this.parsePositiveInt(
    process.env.REDIRECT_RATE_LIMIT_WINDOW_MS,
    60_000,
  );
  private readonly maxEntries = this.parsePositiveInt(
    process.env.REDIRECT_RATE_LIMIT_MAX_KEYS,
    10_000,
  );

  constructor(
    private readonly metricsService: MetricsService,
    private readonly structuredLogger: StructuredLoggerService,
  ) {}

  check(request: Request): RateLimitDecision {
    const now = Date.now();
    const clientKey = this.getClientKey(request);
    this.pruneExpiredBuckets(now);

    const existing = this.buckets.get(clientKey);
    if (!existing || existing.resetAt <= now) {
      this.buckets.set(clientKey, {
        count: 1,
        resetAt: now + this.windowMs,
        lastSeenAt: now,
      });

      this.enforceBucketCap();
      return { allowed: true, retryAfterSeconds: 0 };
    }

    existing.count += 1;
    existing.lastSeenAt = now;

    if (existing.count > this.maxRequests) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((existing.resetAt - now) / 1000),
      );

      this.metricsService.incrementRateLimitedRequests();
      this.structuredLogger.warn('redirect.rate_limited', {
        client_ip: clientKey,
        retry_after_seconds: retryAfterSeconds,
        path: request.originalUrl || request.url,
      });

      return {
        allowed: false,
        retryAfterSeconds,
      };
    }

    return { allowed: true, retryAfterSeconds: 0 };
  }

  private getClientKey(request: Request) {
    const forwardedFor = request.get('x-forwarded-for')?.split(',')[0]?.trim();
    const directIp =
      request.ip?.trim() || request.socket.remoteAddress?.trim() || 'unknown';

    return forwardedFor || directIp || 'unknown';
  }

  private pruneExpiredBuckets(now: number) {
    for (const [key, record] of this.buckets.entries()) {
      if (record.resetAt <= now) {
        this.buckets.delete(key);
      }
    }
  }

  private enforceBucketCap() {
    if (this.buckets.size <= this.maxEntries) {
      return;
    }

    const oldestEntries = [...this.buckets.entries()]
      .sort((left, right) => left[1].lastSeenAt - right[1].lastSeenAt)
      .slice(0, this.buckets.size - this.maxEntries);

    for (const [key] of oldestEntries) {
      this.buckets.delete(key);
    }
  }

  private parsePositiveInt(value: string | undefined, fallback: number) {
    const parsed = Number.parseInt(value ?? '', 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
  }
}
