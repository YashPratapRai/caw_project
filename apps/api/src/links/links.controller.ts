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
} from '@nestjs/common';
import type { Request } from 'express';
import { CreateLinkDto } from './dto/create-link.dto';
import { LinksService } from './links.service';

@Controller('links')
export class LinksController {
  constructor(private readonly linksService: LinksService) {}

  @Post()
  async createLink(
    @Body() body: CreateLinkDto,
    @Req() request: Request,
    @Headers('x-user-id') currentUserId?: string,
    @Headers('x-forwarded-proto') forwardedProto?: string,
    @Headers('x-forwarded-host') forwardedHost?: string,
  ) {
    const link = await this.linksService.createShortLink(body, currentUserId);
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
  async listLinks(@Headers('x-user-id') currentUserId?: string) {
    const links = await this.linksService.listLinksForOwner(currentUserId);

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
    @Headers('x-user-id') currentUserId?: string,
  ) {
    const link = await this.linksService.getLinkByIdForOwner(id, currentUserId);

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
    @Headers('x-user-id') currentUserId?: string,
  ) {
    await this.linksService.deleteLinkByIdForOwner(id, currentUserId);
  }
}
