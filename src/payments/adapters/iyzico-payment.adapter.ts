import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import {
  IPaymentProvider,
  PaymentCheckoutRequest,
  PaymentCheckoutResult,
  PaymentWebhookPayload,
} from '../payment-provider.interface';

/**
 * İyzico ödeme sağlayıcısı için hazır adaptör.
 * IYZICO_API_KEY, IYZICO_SECRET_KEY ve IYZICO_WEBHOOK_SECRET .env değerleri girildiğinde aktifleşir.
 */
@Injectable()
export class IyzicoPaymentAdapter implements IPaymentProvider {
  readonly name = 'iyzico' as const;

  constructor(private readonly configService: ConfigService) {}

  async initiateCheckout(req: PaymentCheckoutRequest): Promise<PaymentCheckoutResult> {
    const apiKey = this.configService.get<string>('IYZICO_API_KEY');
    const secretKey = this.configService.get<string>('IYZICO_SECRET_KEY');
    const baseUrl = this.configService.get<string>(
      'IYZICO_BASE_URL',
      'https://sandbox-api.iyzipay.com',
    );

    if (!apiKey || !secretKey) {
      throw new ServiceUnavailableException(
        'Ödeme sağlayıcısı (iyzico) API anahtarları henüz yapılandırılmamış.',
      );
    }

    const randomKey = crypto.randomBytes(8).toString('hex');
    const body = {
      locale: 'tr',
      conversationId: req.purchaseId,
      price: req.amount.toFixed(2),
      paidPrice: req.amount.toFixed(2),
      currency: req.currency || 'TRY',
      basketId: req.packageId,
      callbackUrl: req.callbackUrl || '',
    };

    const payloadString = JSON.stringify(body);
    const signature = crypto
      .createHmac('sha256', secretKey)
      .update(`${randomKey}/payment/iyzipos/checkoutform/initialize/auth/ecom${payloadString}`)
      .digest('hex');

    const authString = Buffer.from(
      `apiKey:${apiKey}&randomKey:${randomKey}&signature:${signature}`,
    ).toString('base64');

    const response = await fetch(`${baseUrl}/payment/iyzipos/checkoutform/initialize/auth/ecom`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `IYZWSv2 ${authString}`,
        'x-iyzi-rnd': randomKey,
      },
      body: payloadString,
    });

    const data = (await response.json()) as {
      status?: string;
      token?: string;
      paymentPageUrl?: string;
      errorMessage?: string;
    };

    if (!response.ok || data.status !== 'success' || !data.token) {
      throw new ServiceUnavailableException(
        data.errorMessage || 'iyzico ödeme oturumu başlatılamadı.',
      );
    }

    return {
      provider: 'iyzico',
      paymentToken: data.token,
      checkoutUrl: data.paymentPageUrl || null,
      status: 'pending',
    };
  }

  verifyWebhookSignature(payload: PaymentWebhookPayload, signature: string): boolean {
    const secret =
      this.configService.get<string>('IYZICO_WEBHOOK_SECRET') ||
      this.configService.get<string>('IYZICO_SECRET_KEY');
    if (!secret || !signature || !payload.purchaseId) return false;

    const expected = crypto
      .createHmac('sha256', secret)
      .update(`${payload.purchaseId}:${payload.paymentReference || ''}:${payload.status}`)
      .digest('hex');

    const sigBuf = Buffer.from(signature, 'utf8');
    const expBuf = Buffer.from(expected, 'utf8');
    if (sigBuf.length !== expBuf.length) return false;
    return crypto.timingSafeEqual(sigBuf, expBuf);
  }
}

