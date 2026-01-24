import Transport from 'winston-transport';

interface WebhookTransportOptions extends Transport.TransportStreamOptions {
  webhookUrl?: string;
  webhookType?: 'discord' | 'slack';
  minLevel?: string;
  appName?: string;
}

/**
 * Custom Winston Transport for sending alerts to Discord/Slack webhooks
 * Kritik hatalar ve güvenlik olayları için webhook bildirimleri gönderir
 */
export class WebhookTransport extends Transport {
  private webhookUrl: string;
  private webhookType: 'discord' | 'slack';
  private appName: string;

  constructor(opts: WebhookTransportOptions) {
    super(opts);
    
    this.webhookUrl = opts.webhookUrl || '';
    this.webhookType = opts.webhookType || 'discord';
    this.appName = opts.appName || 'Tosyam Backend';

    // Webhook URL yoksa transport'u disable et
    if (!this.webhookUrl) {
      this.silent = true;
    }
  }

  log(info: any, callback: () => void) {
    setImmediate(() => {
      this.emit('logged', info);
    });

    // Webhook URL yoksa skip
    if (!this.webhookUrl || this.silent) {
      callback();
      return;
    }

    // Sadece error ve warn seviyesindeki logları gönder
    if (info.level !== 'error' && info.level !== 'warn') {
      callback();
      return;
    }

    // Webhook payload oluştur
    const payload = this.formatPayload(info);

    // Webhook'a gönder (async, arka planda)
    this.sendWebhook(payload).catch((error) => {
      // Webhook hatası uygulamayı durdurmamalı, sadece log
      console.error('Webhook send error:', error.message);
    });

    callback();
  }

  private formatPayload(info: any): any {
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
                      value: JSON.stringify(info.context, null, 2).substring(
                        0,
                        1000,
                      ),
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
    } else {
      // Slack format
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
                      value: JSON.stringify(info.context, null, 2).substring(
                        0,
                        1000,
                      ),
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

  private async sendWebhook(payload: any): Promise<void> {
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
    } catch (error) {
      throw error;
    }
  }

  private getEmoji(level: string): string {
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

  private getColor(level: string): number {
    switch (level) {
      case 'error':
        return 16711680; // Red
      case 'warn':
        return 16776960; // Yellow
      case 'info':
        return 3447003; // Blue
      default:
        return 8421504; // Gray
    }
  }
}

