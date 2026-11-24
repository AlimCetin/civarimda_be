import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AdPackage } from '../entities/ad-package.entity';
import { AdPurchase, PaymentStatus } from '../entities/ad-purchase.entity';
import { isValidId } from '../common/utils/id.util';
import { IPaymentProvider } from './payment-provider.interface';
import { MockPaymentAdapter } from './adapters/mock-payment.adapter';
import { IyzicoPaymentAdapter } from './adapters/iyzico-payment.adapter';
import { InitiateCheckoutDto, PaymentWebhookDto } from './dto/payment.dto';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(AdPackage) private readonly packageRepo: Repository<AdPackage>,
    @InjectRepository(AdPurchase) private readonly purchaseRepo: Repository<AdPurchase>,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
    private readonly mockAdapter: MockPaymentAdapter,
    private readonly iyzicoAdapter: IyzicoPaymentAdapter,
  ) {}

  private getActiveProvider(explicit?: string): IPaymentProvider {
    const providerName = (
      explicit || this.configService.get<string>('PAYMENT_PROVIDER', 'mock')
    ).toLowerCase();
    if (providerName === 'iyzico') {
      return this.iyzicoAdapter;
    }
    return this.mockAdapter;
  }

  async initiateCheckout(userId: string, packageId: string, dto: InitiateCheckoutDto) {
    if (!isValidId(packageId)) {
      throw new BadRequestException('Geçersiz paket kimliği.');
    }

    const pkg = await this.packageRepo.findOne({
      where: { id: packageId, isActive: true },
    });
    if (!pkg) {
      throw new NotFoundException('Reklam paketi bulunamadı.');
    }

    const purchase = this.purchaseRepo.create({
      userId,
      packageId: pkg.id,
      amountPaid: Number(pkg.price),
      currency: pkg.currency,
      paymentStatus: PaymentStatus.PENDING,
      paymentReference: null,
      remainingAdCredits: 0,
    });
    const saved = await this.purchaseRepo.save(purchase);

    const provider = this.getActiveProvider();
    const checkout = await provider.initiateCheckout({
      purchaseId: saved.id,
      userId,
      packageId: pkg.id,
      packageName: pkg.name,
      amount: Number(pkg.price),
      currency: pkg.currency,
      callbackUrl: dto.callbackUrl,
    });

    return {
      purchaseId: saved.id,
      package: pkg,
      checkout,
    };
  }

  async handleWebhook(
    providerName: string,
    signature: string,
    dto: PaymentWebhookDto,
  ) {
    if (providerName !== 'mock' && providerName !== 'iyzico') {
      throw new BadRequestException('Desteklenmeyen ödeme sağlayıcısı.');
    }

    const provider = this.getActiveProvider(providerName);
    const isValid = provider.verifyWebhookSignature(dto, signature);
    if (!isValid) {
      throw new UnauthorizedException('Geçersiz ödeme webhook imzası.');
    }

    return this.dataSource.transaction(async (manager) => {
      const purchase = await manager.findOne(AdPurchase, {
        where: { id: dto.purchaseId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!purchase) {
        throw new NotFoundException('Ödeme kaydı bulunamadı.');
      }

      // Idempotency: Zaten ödenmiş bir kayıt için ikinci kez kredi tanımlama
      if (purchase.paymentStatus === PaymentStatus.PAID) {
        return { success: true, alreadyProcessed: true, purchase };
      }

      if (dto.status === 'paid') {
        purchase.paymentStatus = PaymentStatus.PAID;
        purchase.remainingAdCredits = 1;
        purchase.paymentReference = dto.paymentReference || `${provider.name}-${Date.now()}`;
      } else {
        purchase.paymentStatus = PaymentStatus.FAILED;
        purchase.remainingAdCredits = 0;
      }

      const updated = await manager.save(AdPurchase, purchase);
      return { success: true, alreadyProcessed: false, purchase: updated };
    });
  }

  async getMyPurchases(userId: string) {
    return this.purchaseRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }
}

