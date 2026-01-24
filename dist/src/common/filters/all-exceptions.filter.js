"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AllExceptionsFilter = void 0;
const common_1 = require("@nestjs/common");
const logger_service_1 = require("../logger/logger.service");
let AllExceptionsFilter = class AllExceptionsFilter {
    logger;
    constructor(logger) {
        this.logger = logger;
    }
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const status = exception instanceof common_1.HttpException
            ? exception.getStatus()
            : common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        const message = exception instanceof common_1.HttpException
            ? exception.getResponse()
            : 'Internal server error';
        this.logger.error(`${request.method} ${request.url} - ${typeof message === 'string' ? message : message.message || 'Internal server error'}`, exception instanceof Error ? exception.stack : JSON.stringify(exception), 'AllExceptionsFilter');
        if (status === common_1.HttpStatus.UNAUTHORIZED || status === common_1.HttpStatus.FORBIDDEN) {
            this.logger.securityEvent('Unauthorized access attempt', {
                path: request.url,
                method: request.method,
                statusCode: status,
                ip: request.ip,
                userAgent: request.get('user-agent'),
            });
        }
        const isDevelopment = process.env.NODE_ENV !== 'production';
        const errorResponse = {
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            method: request.method,
            message: typeof message === 'string' ? message : message.message || 'An error occurred',
        };
        if (isDevelopment && exception instanceof Error) {
            errorResponse.stack = exception.stack;
        }
        response.status(status).json(errorResponse);
    }
};
exports.AllExceptionsFilter = AllExceptionsFilter;
exports.AllExceptionsFilter = AllExceptionsFilter = __decorate([
    (0, common_1.Catch)(),
    __metadata("design:paramtypes", [logger_service_1.AppLoggerService])
], AllExceptionsFilter);
//# sourceMappingURL=all-exceptions.filter.js.map