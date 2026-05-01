import { Injectable } from '@nestjs/common';

type LogLevel = 'info' | 'warn' | 'error';

@Injectable()
export class StructuredLoggerService {
  log(level: LogLevel, message: string, metadata: Record<string, unknown> = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...metadata,
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
}
