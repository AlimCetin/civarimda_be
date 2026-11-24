export interface PaymentCheckoutRequest {
  purchaseId: string;
  userId: string;
  packageId: string;
  packageName: string;
  amount: number;
  currency: string;
  callbackUrl?: string;
}

export interface PaymentCheckoutResult {
  provider: 'mock' | 'iyzico';
  paymentToken: string;
  checkoutUrl: string | null;
  status: 'pending' | 'paid';
  testWebhookSignature?: string;
}

export interface PaymentWebhookPayload {
  purchaseId: string;
  paymentReference?: string;
  status: 'paid' | 'failed';
}

export interface IPaymentProvider {
  readonly name: 'mock' | 'iyzico';
  initiateCheckout(req: PaymentCheckoutRequest): Promise<PaymentCheckoutResult>;
  verifyWebhookSignature(payload: PaymentWebhookPayload, signature: string): boolean;
}

