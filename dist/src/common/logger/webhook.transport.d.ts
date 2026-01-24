import Transport from 'winston-transport';
interface WebhookTransportOptions extends Transport.TransportStreamOptions {
    webhookUrl?: string;
    webhookType?: 'discord' | 'slack';
    minLevel?: string;
    appName?: string;
}
export declare class WebhookTransport extends Transport {
    private webhookUrl;
    private webhookType;
    private appName;
    constructor(opts: WebhookTransportOptions);
    log(info: any, callback: () => void): void;
    private formatPayload;
    private sendWebhook;
    private getEmoji;
    private getColor;
}
export {};
