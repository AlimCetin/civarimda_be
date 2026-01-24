import { Injectable, LoggerService } from '@nestjs/common';
import * as winston from 'winston';
import { WebhookTransport } from './webhook.transport';

@Injectable()
export class AppLoggerService implements LoggerService {
  private logger: winston.Logger;

  constructor() {
    const isProduction = process.env.NODE_ENV === 'production';
    
    const transports: winston.transport[] = [
      // Console transport
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
            const contextStr = context ? `[${context}]` : '';
            const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
            return `${timestamp} ${level} ${contextStr} ${message} ${metaStr}`;
          }),
        ),
      }),
      // File transport for errors
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
        ),
      }),
      // File transport for all logs
      new winston.transports.File({
        filename: 'logs/combined.log',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
        ),
      }),
    ];

    // Webhook transport (Discord/Slack) - Sadece webhook URL varsa aktif
    const webhookUrl = process.env.ALERT_WEBHOOK_URL;
    const webhookType = (process.env.ALERT_WEBHOOK_TYPE || 'discord') as 'discord' | 'slack';
    
    if (webhookUrl) {
      transports.push(
        new WebhookTransport({
          webhookUrl,
          webhookType,
          level: 'warn', // Sadece warn ve error seviyelerini gönder
          appName: 'Tosyam Backend',
        }),
      );
    }
    
    this.logger = winston.createLogger({
      level: isProduction ? 'info' : 'debug',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json(),
      ),
      defaultMeta: { service: 'tosyam-backend' },
      transports,
    });
  }

  log(message: string, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { trace, context });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context });
  }

  // Security event logging
  securityEvent(event: string, details: Record<string, any>, context?: string) {
    this.logger.warn(`[SECURITY] ${event}`, {
      ...details,
      context: context || 'Security',
      timestamp: new Date().toISOString(),
    });
  }
}

