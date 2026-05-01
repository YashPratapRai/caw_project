import { Injectable } from '@nestjs/common';
import { Socket } from 'net';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HealthService {
  private readonly dbTimeoutMs = this.parsePositiveInt(
    process.env.DB_TIMEOUT_MS,
    2500,
  );
  private readonly redisTimeoutMs = this.parsePositiveInt(
    process.env.REDIS_HEALTH_TIMEOUT_MS,
    500,
  );

  constructor(private readonly prisma: PrismaService) {}

  async getHealthStatus() {
    const [db, redis] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
    ]);

    const status = db === 'ok' && redis === 'ok' ? 'ok' : 'degraded';

    return {
      status,
      dependencies: {
        db,
        redis,
      },
    };
  }

  private async checkDatabase() {
    try {
      await this.withTimeout(
        this.prisma.$queryRawUnsafe('SELECT 1'),
        this.dbTimeoutMs,
        'Database health check timed out.',
      );
      return 'ok';
    } catch {
      return 'unavailable';
    }
  }

  private async checkRedis() {
    if (!process.env.REDIS_URL) {
      return 'not_configured';
    }

    let redisUrl: URL;
    try {
      redisUrl = new URL(process.env.REDIS_URL);
    } catch {
      return 'invalid_config';
    }

    const port = redisUrl.port
      ? Number.parseInt(redisUrl.port, 10)
      : 6379;

    return new Promise<string>((resolve) => {
      const socket = new Socket();
      let settled = false;

      const finish = (value: string) => {
        if (settled) {
          return;
        }

        settled = true;
        socket.destroy();
        resolve(value);
      };

      socket.setTimeout(this.redisTimeoutMs);
      socket.once('connect', () => finish('ok'));
      socket.once('timeout', () => finish('unavailable'));
      socket.once('error', () => finish('unavailable'));
      socket.connect(port, redisUrl.hostname);
    });
  }

  private async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    message: string,
  ) {
    return Promise.race<T>([
      promise,
      new Promise<T>((_, reject) => {
        const timeout = setTimeout(() => reject(new Error(message)), timeoutMs);
        timeout.unref?.();
      }),
    ]);
  }

  private parsePositiveInt(value: string | undefined, fallback: number) {
    const parsed = Number.parseInt(value ?? '', 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
  }
}
