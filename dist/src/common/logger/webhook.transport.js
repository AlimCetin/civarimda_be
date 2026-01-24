"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookTransport = void 0;
const winston_transport_1 = __importDefault(require("winston-transport"));
class WebhookTransport extends winston_transport_1.default {
    webhookUrl;
    webhookType;
    appName;
    constructor(opts) {
        super(opts);
        this.webhookUrl = opts.webhookUrl || '';
        this.webhookType = opts.webhookType || 'discord';
        this.appName = opts.appName || 'Tosyam Backend';
        if (!this.webhookUrl) {
            this.silent = true;
        }
    }
    log(info, callback) {
        setImmediate(() => {
            this.emit('logged', info);
        });
        if (!this.webhookUrl || this.silent) {
            callback();
            return;
        }
        if (info.level !== 'error' && info.level !== 'warn') {
            callback();
            return;
        }
        const payload = this.formatPayload(info);
        this.sendWebhook(payload).catch((error) => {
            console.error('Webhook send error:', error.message);
        });
        callback();
    }
    formatPayload(info) {
        const timestamp = new Date().toISOString();
        const emoji = this.getEmoji(info.level);
        const color = this.getColor(info.level);
        if (this.webhookType === 'discord') {
            return {
                username: this.appName,
                embeds: [
                    {
                        title: `${emoji} ${info.level.toUpperCase()} Alert`,
                        description: info.message,
                        color: color,
                        fields: [
                            {
                                name: 'Timestamp',
                                value: timestamp,
                                inline: true,
                            },
                            {
                                name: 'Environment',
                                value: process.env.NODE_ENV || 'development',
                                inline: true,
                            },
                            ...(info.context
                                ? [
                                    {
                                        name: 'Context',
                                        value: JSON.stringify(info.context, null, 2).substring(0, 1000),
                                    },
                                ]
                                : []),
                            ...(info.stack
                                ? [
                                    {
                                        name: 'Stack Trace',
                                        value: `\`\`\`\n${info.stack.substring(0, 1000)}\n\`\`\``,
                                    },
                                ]
                                : []),
                        ],
                        timestamp: timestamp,
                    },
                ],
            };
        }
        else {
            return {
                username: this.appName,
                icon_emoji: emoji,
                attachments: [
                    {
                        color: color === 16711680 ? 'danger' : 'warning',
                        title: `${info.level.toUpperCase()} Alert`,
                        text: info.message,
                        fields: [
                            {
                                title: 'Timestamp',
                                value: timestamp,
                                short: true,
                            },
                            {
                                title: 'Environment',
                                value: process.env.NODE_ENV || 'development',
                                short: true,
                            },
                            ...(info.context
                                ? [
                                    {
                                        title: 'Context',
                                        value: JSON.stringify(info.context, null, 2).substring(0, 1000),
                                    },
                                ]
                                : []),
                            ...(info.stack
                                ? [
                                    {
                                        title: 'Stack Trace',
                                        value: `\`\`\`\n${info.stack.substring(0, 1000)}\n\`\`\``,
                                    },
                                ]
                                : []),
                        ],
                        ts: Math.floor(Date.now() / 1000),
                    },
                ],
            };
        }
    }
    async sendWebhook(payload) {
        try {
            const response = await fetch(this.webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                throw new Error(`Webhook returned ${response.status}`);
            }
        }
        catch (error) {
            throw error;
        }
    }
    getEmoji(level) {
        switch (level) {
            case 'error':
                return '🔴';
            case 'warn':
                return '⚠️';
            case 'info':
                return 'ℹ️';
            default:
                return '📝';
        }
    }
    getColor(level) {
        switch (level) {
            case 'error':
                return 16711680;
            case 'warn':
                return 16776960;
            case 'info':
                return 3447003;
            default:
                return 8421504;
        }
    }
}
exports.WebhookTransport = WebhookTransport;
//# sourceMappingURL=webhook.transport.js.map