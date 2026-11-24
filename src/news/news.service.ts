import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  NewsCategory,
  NewsScope,
  RegionalNews,
} from '../entities/regional-news.entity';
import { CreateNewsDto, UpdateNewsDto } from './dto/news.dto';

@Injectable()
export class NewsService {
  constructor(
    @InjectRepository(RegionalNews)
    private readonly newsRepo: Repository<RegionalNews>,
  ) {}

  async findAll(
    city?: string,
    scope?: NewsScope,
    category?: NewsCategory,
    page: number = 1,
    limit: number = 20,
    includeInactive: boolean = false,
  ) {
    const safeLimit = Math.min(Math.max(limit, 1), 50);
    const skip = (Math.max(page, 1) - 1) * safeLimit;
    const now = new Date();

    const qb = this.newsRepo.createQueryBuilder('n');

    if (!includeInactive) {
      qb.andWhere('n.isActive = true').andWhere(
        '(n.expiresAt IS NULL OR n.expiresAt > :now)',
        { now },
      );
    }

    if (scope) {
      qb.andWhere('n.scope = :scope', { scope });
    }

    if (category) {
      qb.andWhere('n.category = :category', { category });
    }

    if (city && city.trim()) {
      const cleanCity = city.split('-')[0].trim();
      // Şehir filtresi verildiğinde hem o şehrin bölgesel haberlerini hem de ulusal duyuruları getir
      qb.andWhere(
        '(n.scope = :nationalScope OR n.city ILIKE :city OR n.city ILIKE :cleanCity)',
        {
          nationalScope: NewsScope.NATIONAL,
          city: `%${city.trim()}%`,
          cleanCity: `%${cleanCity}%`,
        },
      );
    }

    const [items, total] = await qb
      .orderBy('n.isPinned', 'DESC')
      .addOrderBy('n.createdAt', 'DESC')
      .skip(skip)
      .take(safeLimit)
      .getManyAndCount();

    return {
      items,
      pagination: {
        page,
        limit: safeLimit,
        total,
        hasMore: skip + items.length < total,
      },
    };
  }

  async findOne(id: string): Promise<RegionalNews> {
    const item = await this.newsRepo.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException('Haber veya duyuru bulunamadı.');
    }
    return item;
  }

  async create(publisherId: string, dto: CreateNewsDto): Promise<RegionalNews> {
    const entity = this.newsRepo.create({
      title: dto.title,
      summary: dto.summary ?? '',
      content: dto.content,
      category: dto.category ?? NewsCategory.NEWS,
      scope: dto.scope ?? NewsScope.REGIONAL,
      city: dto.scope === NewsScope.NATIONAL ? null : (dto.city ?? null),
      imageUrl: dto.imageUrl ?? null,
      isPinned: dto.isPinned ?? false,
      isActive: dto.isActive ?? true,
      publishedBy: publisherId,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
    });
    return this.newsRepo.save(entity);
  }

  async update(id: string, dto: UpdateNewsDto): Promise<RegionalNews> {
    const item = await this.findOne(id);

    if (dto.title !== undefined) item.title = dto.title;
    if (dto.summary !== undefined) item.summary = dto.summary;
    if (dto.content !== undefined) item.content = dto.content;
    if (dto.category !== undefined) item.category = dto.category;
    if (dto.scope !== undefined) item.scope = dto.scope;
    if (dto.city !== undefined) {
      item.city = item.scope === NewsScope.NATIONAL ? null : dto.city;
    }
    if (dto.imageUrl !== undefined) item.imageUrl = dto.imageUrl;
    if (dto.isPinned !== undefined) item.isPinned = dto.isPinned;
    if (dto.isActive !== undefined) item.isActive = dto.isActive;
    if (dto.expiresAt !== undefined) {
      item.expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;
    }

    return this.newsRepo.save(item);
  }

  async remove(id: string): Promise<{ success: boolean }> {
    const item = await this.findOne(id);
    await this.newsRepo.delete(item.id);
    return { success: true };
  }
}

