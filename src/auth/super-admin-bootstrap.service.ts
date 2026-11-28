import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { User } from '../entities/user.entity';
import { UserCredentials } from '../entities/user-credentials.entity';

/**
 * Uygulama başlatıldığında veritabanında hiç `super_admin` hesabı yoksa
 * `SUPER_ADMIN_EMAIL` ve `SUPER_ADMIN_PASSWORD` ortam değişkenlerini kullanarak
 * mevcut verilere dokunmadan ilk süper admin hesabını güvenli şekilde oluşturur.
 */
@Injectable()
export class SuperAdminBootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SuperAdminBootstrapService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const rawEmail = this.configService.get<string>('SUPER_ADMIN_EMAIL')?.trim();
    const rawPassword = this.configService.get<string>('SUPER_ADMIN_PASSWORD');
    const fullName =
      this.configService.get<string>('SUPER_ADMIN_NAME')?.trim() || 'Süper Admin';

    if (!rawEmail || !rawPassword) {
      return;
    }

    const email = rawEmail.toLowerCase();
    if (!email.includes('@') || rawPassword.length < 8) {
      this.logger.warn(
        'SUPER_ADMIN_EMAIL veya SUPER_ADMIN_PASSWORD geçersiz (şifre en az 8 karakter olmalı); süper admin oluşturma atlandı.',
      );
      return;
    }

    try {
      await this.dataSource.transaction(async (manager) => {
        const userRepo = manager.getRepository(User);
        const credsRepo = manager.getRepository(UserCredentials);

        const existingSuperAdminCount = await userRepo.count({
          where: { role: 'super_admin' },
        });
        if (existingSuperAdminCount > 0) {
          return;
        }

        const existingCreds = await credsRepo.findOne({ where: { email } });
        if (existingCreds) {
          await userRepo.update(
            { id: existingCreds.userId },
            { role: 'super_admin', isVerified: true },
          );
          this.logger.log(`Mevcut kullanıcı süper admin olarak yetkilendirildi: ${email}`);
          return;
        }

        const user = userRepo.create({
          fullName,
          role: 'super_admin',
          isVerified: true,
        });
        const savedUser = await userRepo.save(user);

        const credentials = credsRepo.create({
          userId: savedUser.id,
          email,
          password: rawPassword,
        });
        await credsRepo.save(credentials);

        this.logger.log(`İlk süper admin hesabı otomatik oluşturuldu: ${email}`);
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Bilinmeyen hata';
      this.logger.error(`Süper admin başlangıç kontrolü başarısız oldu: ${message}`);
    }
  }
}

