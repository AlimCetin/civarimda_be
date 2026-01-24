import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AppLoggerService } from '../logger/logger.service';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: AppLoggerService) {}

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
    this.logger.error(
      `${request.method} ${request.url} - ${typeof message === 'string' ? message : (message as any).message || 'Internal server error'}`,
      exception instanceof Error ? exception.stack : JSON.stringify(exception),
      'AllExceptionsFilter',
    );

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
    const errorResponse: any = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: typeof message === 'string' ? message : (message as any).message || 'An error occurred',
    };

    if (isDevelopment && exception instanceof Error) {
      errorResponse.stack = exception.stack;
    }

    response.status(status).json(errorResponse);
  }
}

