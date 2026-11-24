import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import { User } from '../entities/user.entity';
import { PaymentsService } from './payments.service';
import { InitiateCheckoutDto, PaymentWebhookDto } from './dto/payment.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('packages/:packageId/checkout')
  @UseGuards(JwtAuthGuard)
  async initiateCheckout(
    @Param('packageId') packageId: string,
    @Body() dto: InitiateCheckoutDto,
    @CurrentUser() user: User,
  ) {
    return this.paymentsService.initiateCheckout(user.id, packageId, dto);
  }

  @Post('webhook/:provider')
  async handleWebhook(
    @Param('provider') provider: string,
    @Headers('x-payment-signature') signature: string,
    @Body() dto: PaymentWebhookDto,
  ) {
    return this.paymentsService.handleWebhook(provider, signature || '', dto);
  }

  @Get('my-purchases')
  @UseGuards(JwtAuthGuard)
  async getMyPurchases(@CurrentUser() user: User) {
    return this.paymentsService.getMyPurchases(user.id);
  }
}

