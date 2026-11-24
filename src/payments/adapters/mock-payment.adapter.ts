import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import {
  IPaymentProvider,
  PaymentCheckoutRequest,
  PaymentCheckoutResult,
  PaymentWebhookPayload,
} from '../payment-provider.interface';

@Injectable()
export class MockPaymentAdapter implements IPaymentProvider {
  readonly name = 'mock' as const;

  constructor(private readonly configService: ConfigService) {}

  private getWebhookSecret(): string {
    return (
      this.configService.get<string>('PAYMENT_WEBHOOK_SECRET') ||
      this.configService.get<string>('JWT_SECRET') ||
      'dev-mock-webhook-secret'
    );
  }

  private sign(purchaseId: string, status: string): string {
    return crypto
      .createHmac('sha256', this.getWebhookSecret())
      .update(`${purchaseId}:${status}`)
      .digest('hex');
  }

  async initiateCheckout(req: PaymentCheckoutRequest): Promise<PaymentCheckoutResult> {
    const paymentToken = `mock_${req.purchaseId}`;
    return {
      provider: 'mock',
      paymentToken,
      checkoutUrl: null,
      status: 'pending',
      testWebhookSignature: this.sign(req.purchaseId, 'paid'),
    };
  }

  verifyWebhookSignature(payload: PaymentWebhookPayload, signature: string): boolean {
    if (!signature || !payload.purchaseId) return false;
    const expected = this.sign(payload.purchaseId, payload.status);
    const sigBuf = Buffer.from(signature, 'utf8');
    const expBuf = Buffer.from(expected, 'utf8');
    if (sigBuf.length !== expBuf.length) return false;
    return crypto.timingSafeEqual(sigBuf, expBuf);
  }
}

