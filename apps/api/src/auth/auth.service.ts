import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  private readonly apiKeys: Record<string, string>;

  constructor(private readonly config: ConfigService) {
    const apiKeysJson = this.config.get<string>('API_KEYS');
    if (!apiKeysJson) {
      throw new Error('API_KEYS environment variable is required');
    }

    try {
      this.apiKeys = JSON.parse(apiKeysJson);
    } catch (error) {
      throw new Error('API_KEYS must be valid JSON');
    }
  }

  validateApiKey(apiKey: string | undefined): string {
    if (!apiKey) {
      throw new UnauthorizedException('Missing or invalid API key');
    }

    const principalId = this.apiKeys[apiKey];
    if (!principalId) {
      throw new UnauthorizedException('Missing or invalid API key');
    }

    return principalId;
  }
}