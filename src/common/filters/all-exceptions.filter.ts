import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AppLoggerService } from '../logger/logger.service';
import { ErrorTrackingService } from '../../error-tracking/error-tracking.service';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    private readonly logger: AppLoggerService,
    private readonly errorTrackingService?: ErrorTrackingService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    // Log error details with structured logging
    const rawMsg =
      typeof message === 'string'
        ? message
        : (message as { message?: string | string[] })?.message || 'Internal server error';
    const formattedMsg = Array.isArray(rawMsg) ? rawMsg.join(', ') : rawMsg;

    this.logger.error(
      `[${status}] ${request.method} ${request.url} - ${formattedMsg}`,
      exception instanceof Error ? exception.stack : JSON.stringify(exception),
      'AllExceptionsFilter',
    );

    // 5xx sunucu hatalarını Admin Hata Takibi tablosuna asenkron olarak kaydet
    if (status >= 500 && this.errorTrackingService) {
      const reqUser = (request as Request & { user?: { id?: string } }).user;
      void this.errorTrackingService
        .recordError({
          source: 'backend',
          severity: 'fatal',
          message: formattedMsg || 'Internal server error',
          stack: exception instanceof Error ? exception.stack : null,
          path: request.url,
          method: request.method,
          statusCode: status,
          userId: reqUser?.id || null,
        })
        .catch(() => {
          // Hata kayıt işlemi ana yanıtı bozmamalı
        });
    }

    // Log security-related errors
    if (status === HttpStatus.UNAUTHORIZED || status === HttpStatus.FORBIDDEN) {
      this.logger.securityEvent('Unauthorized access attempt', {
        path: request.url,
        method: request.method,
        statusCode: status,
        ip: request.ip,
        userAgent: request.get('user-agent'),
      });
    }

    // Don't expose stack trace in production
    const isDevelopment = process.env.NODE_ENV !== 'production';
    const errorResponse: Record<string, unknown> = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: formattedMsg || 'An error occurred',
    };

    if (isDevelopment && exception instanceof Error) {
      errorResponse.stack = exception.stack;
    }

    response.status(status).json(errorResponse);
  }
}

