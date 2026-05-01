import { Controller, Get, HttpException, HttpStatus, Param, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { LinksService } from '../links/links.service';
import { MetricsService } from '../observability/metrics.service';
import { RedirectCacheService } from './redirect-cache.service';
import { RedirectRateLimitService } from './redirect-rate-limit.service';

@Controller('r')
export class RedirectController {
  constructor(
    private readonly linksService: LinksService,
    private readonly redirectRateLimitService: RedirectRateLimitService,
    private readonly redirectCacheService: RedirectCacheService,
    private readonly metricsService: MetricsService,
  ) {}

  @Get(':code')
  async redirect(
    @Param('code') code: string,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    const rateLimitDecision = this.redirectRateLimitService.check(request);
    if (!rateLimitDecision.allowed) {
      response.setHeader(
        'Retry-After',
        rateLimitDecision.retryAfterSeconds.toString(),
      );
      throw new HttpException(
        'Too many redirect requests.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const cachedLink = this.redirectCacheService.get(code.trim());
    if (cachedLink) {
      await this.linksService.recordClickEvent(cachedLink.linkId, request);
      this.metricsService.incrementTotalRedirects();
      return response.redirect(302, cachedLink.longUrl);
    }

    const link = await this.linksService.resolveLinkForRedirect(code, request);
    this.redirectCacheService.set(link.code, {
      linkId: link.id,
      longUrl: link.longUrl,
      expiresAt: link.expiresAt,
    });
    this.metricsService.incrementTotalRedirects();
    return response.redirect(302, link.longUrl);
  }
}
