import { Injectable } from '@nestjs/common';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

@Injectable()
export class RateLimitService {
  private readonly requestsByActor = new Map<string, RateLimitEntry>();

  check(
    key: string,
    limit: number,
    windowMs: number = 60_000,
  ): { allowed: boolean; retryAfterSeconds?: number } {
    const now = Date.now();
    const currentEntry = this.requestsByActor.get(key);

    if (!currentEntry || currentEntry.resetAt <= now) {
      this.requestsByActor.set(key, {
        count: 1,
        resetAt: now + windowMs,
      });
      return { allowed: true };
    }

    if (currentEntry.count >= limit) {
      const retryAfterSeconds = Math.ceil((currentEntry.resetAt - now) / 1000);
      return { allowed: false, retryAfterSeconds };
    }

    currentEntry.count += 1;
    return { allowed: true };
  }
}