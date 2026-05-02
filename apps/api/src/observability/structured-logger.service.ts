import { Injectable } from '@nestjs/common';

type LogLevel = 'info' | 'warn' | 'error';

const SECRET_KEYS = [
  'authorization',
  'x-api-key',
  'cookie',
  'set-cookie',
  'password',
  'token',
  'secret',
];

@Injectable()
export class StructuredLoggerService {
  log(level: LogLevel, message: string, metadata: Record<string, unknown> = {}) {
    const safeMetadata = this.redact(metadata);
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(safeMetadata as Record<string, unknown>),
    };

    const serialized = JSON.stringify(entry);
    if (level === 'error') {
      console.error(serialized);
      return;
    }

    console.log(serialized);
  }

  info(message: string, metadata: Record<string, unknown> = {}) {
    this.log('info', message, metadata);
  }

  warn(message: string, metadata: Record<string, unknown> = {}) {
    this.log('warn', message, metadata);
  }

  error(message: string, metadata: Record<string, unknown> = {}) {
    this.log('error', message, metadata);
  }

  private redact(value: unknown): unknown {
    if (!value || typeof value !== 'object') {
      return value;
    }

    if (Array.isArray(value)) {
      return value.map(item => this.redact(item));
    }

    const output: Record<string, unknown> = {};
    const obj = value as Record<string, unknown>;

    for (const [key, val] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();

      if (SECRET_KEYS.some(secret => lowerKey.includes(secret))) {
        output[key] = '[REDACTED]';
      } else {
        output[key] = this.redact(val);
      }
    }

    return output;
  }
}
