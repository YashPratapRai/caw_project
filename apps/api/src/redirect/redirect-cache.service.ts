import { Injectable } from '@nestjs/common';
import { MetricsService } from '../observability/metrics.service';
import { StructuredLoggerService } from '../observability/structured-logger.service';

type RedirectCacheEntry = {
  linkId: string;
  longUrl: string;
  expiresAt: Date | null;
  cachedAt: number;
};

@Injectable()
export class RedirectCacheService {
  private readonly entries = new Map<string, RedirectCacheEntry>();
  private readonly ttlMs = 60_000;

  constructor(
    private readonly metricsService: MetricsService,
    private readonly structuredLogger: StructuredLoggerService,
  ) {}

  get(code: string) {
    const entry = this.entries.get(code);
    if (!entry) {
      this.metricsService.incrementCacheMisses();
      this.structuredLogger.info('CACHE_MISS', { code });
      return null;
    }

    const now = Date.now();
    if (
      entry.cachedAt + this.ttlMs <= now ||
      (entry.expiresAt && entry.expiresAt.getTime() <= now)
    ) {
      this.entries.delete(code);
      this.metricsService.incrementCacheMisses();
      this.structuredLogger.info('CACHE_MISS', { code });
      return null;
    }

    this.metricsService.incrementCacheHits();
    this.structuredLogger.info('CACHE_HIT', { code });
    return entry;
  }

  set(
    code: string,
    value: { linkId: string; longUrl: string; expiresAt: Date | null },
  ) {
    this.entries.set(code, {
      ...value,
      cachedAt: Date.now(),
    });
  }

  invalidate(code: string) {
    this.entries.delete(code);
  }
}
