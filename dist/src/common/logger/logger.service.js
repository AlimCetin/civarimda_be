"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppLoggerService = void 0;
const common_1 = require("@nestjs/common");
const winston = __importStar(require("winston"));
const webhook_transport_1 = require("./webhook.transport");
let AppLoggerService = class AppLoggerService {
    logger;
    constructor() {
        const isProduction = process.env.NODE_ENV === 'production';
        const transports = [
            new winston.transports.Console({
                format: winston.format.combine(winston.format.colorize(), winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
                    const contextStr = context ? `[${context}]` : '';
                    const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
                    return `${timestamp} ${level} ${contextStr} ${message} ${metaStr}`;
                })),
            }),
            new winston.transports.File({
                filename: 'logs/error.log',
                level: 'error',
                format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
            }),
            new winston.transports.File({
                filename: 'logs/combined.log',
                format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
            }),
        ];
        const webhookUrl = process.env.ALERT_WEBHOOK_URL;
        const webhookType = (process.env.ALERT_WEBHOOK_TYPE || 'discord');
        if (webhookUrl) {
            transports.push(new webhook_transport_1.WebhookTransport({
                webhookUrl,
                webhookType,
                level: 'warn',
                appName: 'Tosyam Backend',
            }));
        }
        this.logger = winston.createLogger({
            level: isProduction ? 'info' : 'debug',
            format: winston.format.combine(winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston.format.errors({ stack: true }), winston.format.splat(), winston.format.json()),
            defaultMeta: { service: 'tosyam-backend' },
            transports,
        });
    }
    log(message, context) {
        this.logger.info(message, { context });
    }
    error(message, trace, context) {
        this.logger.error(message, { trace, context });
    }
    warn(message, context) {
        this.logger.warn(message, { context });
    }
    debug(message, context) {
        this.logger.debug(message, { context });
    }
    verbose(message, context) {
        this.logger.verbose(message, { context });
    }
    securityEvent(event, details, context) {
        this.logger.warn(`[SECURITY] ${event}`, {
            ...details,
            context: context || 'Security',
            timestamp: new Date().toISOString(),
        });
    }
};
exports.AppLoggerService = AppLoggerService;
exports.AppLoggerService = AppLoggerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], AppLoggerService);
//# sourceMappingURL=logger.service.js.map