import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { CreateLinkRateLimitGuard } from '../rate-limit/create-link-rate-limit.guard';
import { CreateLinkDto } from './dto/create-link.dto';
import { LinksService } from './links.service';

@Controller('links')
@UseGuards(ApiKeyGuard)
export class LinksController {
  constructor(private readonly linksService: LinksService) {}

  @Post()
  @UseGuards(CreateLinkRateLimitGuard)
  async createLink(
    @Body() body: CreateLinkDto,
    @Req() request: Request,
    @Headers('x-forwarded-proto') forwardedProto?: string,
    @Headers('x-forwarded-host') forwardedHost?: string,
  ) {
    const link = await this.linksService.createShortLink(body, request.principal_id);
    const shortUrl = this.linksService.buildShortUrl(
      request,
      link.code,
      forwardedProto,
      forwardedHost,
    );

    return {
      id: link.id,
      code: link.code,
      short_url: shortUrl,
      long_url: link.longUrl,
      created_at: link.createdAt,
      created_by: link.createdBy,
      expires_at: link.expiresAt,
      tags: link.tags,
    };
  }

  @Get()
  async listLinks(@Req() request: Request) {
    const links = await this.linksService.listLinksForOwner(request.principal_id);

    return links.map((link) => ({
      id: link.id,
      code: link.code,
      long_url: link.longUrl,
      created_at: link.createdAt,
      created_by: link.createdBy,
      expires_at: link.expiresAt,
      tags: link.tags,
    }));
  }

  @Get(':id')
  async getLink(
    @Param('id') id: string,
    @Req() request: Request,
  ) {
    const link = await this.linksService.getLinkByIdForOwner(id, request.principal_id);

    return {
      id: link.id,
      code: link.code,
      long_url: link.longUrl,
      created_at: link.createdAt,
      created_by: link.createdBy,
      expires_at: link.expiresAt,
      tags: link.tags,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteLink(
    @Param('id') id: string,
    @Req() request: Request,
  ) {
    await this.linksService.deleteLinkByIdForOwner(id, request.principal_id);
  }
}
