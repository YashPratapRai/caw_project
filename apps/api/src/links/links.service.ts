import {
  BadRequestException,
  GatewayTimeoutException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, type Link } from '@prisma/client';
import { createHash, randomBytes } from 'crypto';
import type { Request } from 'express';
import { RedirectCacheService } from '../redirect/redirect-cache.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLinkDto } from './dto/create-link.dto';

const controlCharacterPattern = /[\u0000-\u001F\u007F]/;

@Injectable()
export class LinksService {
  private static readonly maxCodeGenerationAttempts = 5;
  private static readonly shortCodeLength = 8;
  private readonly dbTimeoutMs = this.parsePositiveInt(
    process.env.DB_TIMEOUT_MS,
    2500,
  );

  constructor(
    private readonly prisma: PrismaService,
    private readonly redirectCacheService: RedirectCacheService,
  ) {}

  async createShortLink(input: CreateLinkDto, currentUserId: string | undefined) {
    const longUrl = this.normalizeLongUrl(input.long_url);
    const createdBy = this.requireCurrentUserId(currentUserId);
    const expiresAt = this.parseOptionalDate(input.expires_at, 'expires_at');
    const tags = this.normalizeTags(input.tags);

    if (expiresAt && expiresAt <= new Date()) {
      throw new BadRequestException('expires_at must be in the future.');
    }

    for (
      let attempt = 0;
      attempt < LinksService.maxCodeGenerationAttempts;
      attempt += 1
    ) {
      try {
        return await this.withDbTimeout(
          'create link',
          this.prisma.link.create({
            data: {
              code: this.generateShortCode(),
              longUrl,
              createdBy,
              expiresAt,
              tags,
            },
          }),
        );
      } catch (error) {
        if (this.isUniqueCodeCollision(error)) {
          continue;
        }

        throw error;
      }
    }

    throw new InternalServerErrorException(
      'Unable to generate a unique short code. Retry the request.',
    );
  }

  async listLinksForOwner(currentUserId: string | undefined) {
    const createdBy = this.requireCurrentUserId(currentUserId);

    return this.withDbTimeout(
      'list links',
      this.prisma.link.findMany({
        where: { createdBy },
        orderBy: { createdAt: 'desc' },
      }),
    );
  }

  async getLinkByIdForOwner(id: string, currentUserId: string | undefined) {
    const normalizedId = id.trim();
    if (!normalizedId) {
      throw new NotFoundException('Link was not found.');
    }

    const createdBy = this.requireCurrentUserId(currentUserId);
    const link = await this.withDbTimeout(
      'get link by id',
      this.prisma.link.findFirst({
        where: {
          id: normalizedId,
          createdBy,
        },
      }),
    );

    if (!link) {
      throw new NotFoundException('Link was not found.');
    }

    return link;
  }

  async deleteLinkByIdForOwner(id: string, currentUserId: string | undefined) {
    const link = await this.getLinkByIdForOwner(id, currentUserId);

    await this.withDbTimeout(
      'delete link by id',
      this.prisma.link.delete({
        where: { id: link.id },
      }),
    );

    this.redirectCacheService.invalidate(link.code);
  }

  buildShortUrl(
    request: Request,
    code: string,
    forwardedProto?: string,
    forwardedHost?: string,
  ) {
    const protocol =
      this.firstHeaderValue(forwardedProto) ?? request.protocol ?? 'http';
    const host = this.firstHeaderValue(forwardedHost) ?? request.get('host');

    if (!host) {
      throw new InternalServerErrorException('Unable to determine request host.');
    }

    return `${protocol}://${host}/r/${code}`;
  }

  async resolveLinkForRedirect(code: string, request: Request) {
    const normalizedCode = code.trim();
    if (!normalizedCode) {
      throw new NotFoundException('Short code was not found.');
    }

    // Redirects intentionally stay public because a short link is the shareable
    // product surface. Admin/data endpoints must enforce tenant ownership, but
    // a public redirect would become unusable if every visitor needed tenant auth.
    const link = await this.withDbTimeout(
      'resolve redirect link',
      this.prisma.link.findUnique({
        where: { code: normalizedCode },
      }),
    );

    if (!link || this.isExpired(link)) {
      throw new NotFoundException('Short code was not found.');
    }

    await this.recordClickEvent(link.id, request);

    return link;
  }

  async recordClickEvent(linkId: string, request: Request) {
    await this.withDbTimeout(
      'create click event',
      this.prisma.clickEvent.create({
        data: {
          linkId,
          userAgent: this.normalizeOptionalString(request.get('user-agent')),
          referrer: this.normalizeOptionalString(request.get('referer')),
          ipHash: this.hashIpAddress(request.ip ?? request.socket.remoteAddress),
        },
      }),
    );
  }

  private normalizeLongUrl(rawLongUrl: string) {
    const trimmed = rawLongUrl.trim();

    if (controlCharacterPattern.test(trimmed)) {
      throw new BadRequestException(
        'long_url must not contain control characters.',
      );
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(trimmed);
    } catch {
      throw new BadRequestException('long_url must be a valid URL.');
    }

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new BadRequestException('long_url must use http or https.');
    }

    if (parsedUrl.username || parsedUrl.password) {
      throw new BadRequestException(
        'long_url must not include embedded credentials.',
      );
    }

    return parsedUrl.toString();
  }

  private requireCurrentUserId(rawCurrentUserId: string | undefined) {
    const createdBy = rawCurrentUserId?.trim();
    if (!createdBy) {
      throw new BadRequestException('API key authentication is required.');
    }

    if (createdBy.length > 128) {
      throw new BadRequestException(
        'Principal ID must be 128 characters or fewer.',
      );
    }

    return createdBy;
  }

  private parseOptionalDate(value: string | undefined, fieldName: string) {
    if (!value?.trim()) {
      return null;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(
        `${fieldName} must be a valid ISO-8601 date.`,
      );
    }

    return date;
  }

  private normalizeTags(tags?: string[]) {
    if (!tags) {
      return [];
    }

    return Array.from(new Set(tags.map((tag) => tag.trim()).filter(Boolean)));
  }

  private generateShortCode() {
    return randomBytes(LinksService.shortCodeLength)
      .toString('base64url')
      .slice(0, LinksService.shortCodeLength);
  }

  private isUniqueCodeCollision(error: unknown) {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }

  private isExpired(link: Link) {
    return Boolean(link.expiresAt && link.expiresAt <= new Date());
  }

  private hashIpAddress(ipAddress: string | undefined) {
    const normalizedIp = this.normalizeOptionalString(ipAddress) ?? 'unknown';
    const salt = process.env.IP_HASH_SALT ?? 'dev-ip-hash-salt';

    return createHash('sha256')
      .update(`${salt}:${normalizedIp}`)
      .digest('hex');
  }

  private normalizeOptionalString(value: string | undefined) {
    const normalized = value?.trim();
    return normalized ? normalized.slice(0, 1024) : null;
  }

  private firstHeaderValue(value: string | undefined) {
    return value?.split(',')[0]?.trim() || null;
  }

  private async withDbTimeout<T>(operation: string, promise: Promise<T>) {
    return Promise.race<T>([
      promise,
      new Promise<T>((_, reject) => {
        const timeout = setTimeout(() => {
          reject(
            new GatewayTimeoutException(
              `Database operation timed out during ${operation}.`,
            ),
          );
        }, this.dbTimeoutMs);
        timeout.unref?.();
      }),
    ]);
  }

  private parsePositiveInt(value: string | undefined, fallback: number) {
    const parsed = Number.parseInt(value ?? '', 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
  }
}
