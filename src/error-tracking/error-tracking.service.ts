import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ErrorSeverity,
  ErrorSource,
  SystemErrorLog,
} from '../entities/system-error-log.entity';

@Injectable()
export class ErrorTrackingService {
  constructor(
    @InjectRepository(SystemErrorLog)
    private readonly errorRepo: Repository<SystemErrorLog>,
  ) {}

  async recordError(params: {
    source: ErrorSource;
    severity?: ErrorSeverity;
    message: string;
    stack?: string | null;
    path?: string | null;
    method?: string | null;
    statusCode?: number | null;
    userId?: string | null;
    deviceInfo?: string | null;
  }): Promise<SystemErrorLog> {
    const entry = this.errorRepo.create({
      source: params.source,
      severity: params.severity || 'error',
      message: params.message.slice(0, 1000),
      stack: params.stack ? params.stack.slice(0, 5000) : null,
      path: params.path ? params.path.slice(0, 500) : null,
      method: params.method ? params.method.slice(0, 16) : null,
      statusCode: params.statusCode ?? null,
      userId: params.userId ?? null,
      deviceInfo: params.deviceInfo ? params.deviceInfo.slice(0, 255) : null,
      isResolved: false,
    });
    return this.errorRepo.save(entry);
  }

  async findAll(params: {
    source?: ErrorSource;
    isResolved?: boolean;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(params.page || 1, 1);
    const limit = Math.min(Math.max(params.limit || 30, 1), 100);
    const skip = (page - 1) * limit;

    const qb = this.errorRepo.createQueryBuilder('e');
    if (params.source) {
      qb.andWhere('e.source = :source', { source: params.source });
    }
    if (params.isResolved !== undefined) {
      qb.andWhere('e.isResolved = :isResolved', { isResolved: params.isResolved });
    }

    const [items, total] = await qb
      .orderBy('e.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const [unresolvedCount, backendCount, mobileCount, adminCount] = await Promise.all([
      this.errorRepo.count({ where: { isResolved: false } }),
      this.errorRepo.count({ where: { source: 'backend', isResolved: false } }),
      this.errorRepo.count({ where: { source: 'mobile', isResolved: false } }),
      this.errorRepo.count({ where: { source: 'admin', isResolved: false } }),
    ]);

    return {
      items,
      stats: {
        unresolvedCount,
        backendCount,
        mobileCount,
        adminCount,
      },
      pagination: {
        page,
        limit,
        total,
        hasMore: skip + items.length < total,
      },
    };
  }

  async setResolved(id: string, adminId: string, isResolved: boolean) {
    const entry = await this.errorRepo.findOne({ where: { id } });
    if (!entry) {
      throw new NotFoundException('Hata kaydı bulunamadı.');
    }
    entry.isResolved = isResolved;
    entry.resolvedBy = isResolved ? adminId : null;
    return this.errorRepo.save(entry);
  }
}

