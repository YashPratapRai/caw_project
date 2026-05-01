import { Injectable } from '@nestjs/common';

@Injectable()
export class MetricsService {
  private totalRequests = 0;
  private totalRedirects = 0;
  private rateLimitedRequests = 0;
  private cacheHits = 0;
  private cacheMisses = 0;

  incrementTotalRequests() {
    this.totalRequests += 1;
  }

  incrementTotalRedirects() {
    this.totalRedirects += 1;
  }

  incrementRateLimitedRequests() {
    this.rateLimitedRequests += 1;
  }

  incrementCacheHits() {
    this.cacheHits += 1;
  }

  incrementCacheMisses() {
    this.cacheMisses += 1;
  }

  snapshot() {
    return {
      total_requests: this.totalRequests,
      total_redirects: this.totalRedirects,
      rate_limited_requests: this.rateLimitedRequests,
      cache_hits: this.cacheHits,
      cache_misses: this.cacheMisses,
    };
  }
}
