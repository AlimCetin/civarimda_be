import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUrl, IsUUID, MaxLength } from 'class-validator';

export class InitiateCheckoutDto {
  @IsOptional()
  @IsUrl({}, { message: 'Geçerli bir callback URL girin.' })
  callbackUrl?: string;
}

export class PaymentWebhookDto {
  @IsUUID('4')
  purchaseId: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  paymentReference?: string;

  @IsEnum(['paid', 'failed'])
  @IsNotEmpty()
  status: 'paid' | 'failed';
}

