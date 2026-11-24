import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdPackage } from '../entities/ad-package.entity';
import { AdPurchase } from '../entities/ad-purchase.entity';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { MockPaymentAdapter } from './adapters/mock-payment.adapter';
import { IyzicoPaymentAdapter } from './adapters/iyzico-payment.adapter';

@Module({
  imports: [TypeOrmModule.forFeature([AdPackage, AdPurchase])],
  controllers: [PaymentsController],
  providers: [PaymentsService, MockPaymentAdapter, IyzicoPaymentAdapter],
  exports: [PaymentsService],
})
export class PaymentsModule {}

