import { LoggerService } from '@nestjs/common';
export declare class AppLoggerService implements LoggerService {
    private logger;
    constructor();
    log(message: string, context?: string): void;
    error(message: string, trace?: string, context?: string): void;
    warn(message: string, context?: string): void;
    debug(message: string, context?: string): void;
    verbose(message: string, context?: string): void;
    securityEvent(event: string, details: Record<string, any>, context?: string): void;
}
