import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { getRequestId, getUserId } from './request-context';
import { StructuredLoggerService } from './structured-logger.service';

@Catch()
@Injectable()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly structuredLogger: StructuredLoggerService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const request = context.getRequest<Request>();
    const response = context.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const message =
      exception instanceof HttpException
        ? this.extractHttpMessage(exception)
        : 'Internal server error';
    const requestId = getRequestId(request);

    this.structuredLogger.error('request.failed', {
      request_id: requestId,
      method: request.method,
      path: request.originalUrl || request.url,
      status_code: status,
      user_id: getUserId(request),
      error: message,
      exception_name:
        exception instanceof Error ? exception.name : 'UnknownException',
    });

    response.status(status).json({
      error: message,
      request_id: requestId,
      status,
    });
  }

  private extractHttpMessage(exception: HttpException) {
    const exceptionResponse = exception.getResponse();

    if (typeof exceptionResponse === 'string') {
      return exceptionResponse;
    }

    if (
      exceptionResponse &&
      typeof exceptionResponse === 'object' &&
      'message' in exceptionResponse
    ) {
      const message = (exceptionResponse as { message?: string | string[] }).message;
      if (Array.isArray(message)) {
        return message.join('; ');
      }

      if (typeof message === 'string') {
        return message;
      }
    }

    return exception.message;
  }
}
