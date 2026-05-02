import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { RateLimitService } from './rate-limit.service';

@Injectable()
export class CreateLinkRateLimitGuard implements CanActivate {
  constructor(private readonly rateLimitService: RateLimitService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const principalId = request.principal_id;

    if (!principalId) {
      return false;
    }

    const key = `create:${principalId}`;
    const result = this.rateLimitService.check(key, 10, 60_000); // 10 per minute

    if (!result.allowed) {
      throw new HttpException(
        {
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many link creation requests',
          },
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}