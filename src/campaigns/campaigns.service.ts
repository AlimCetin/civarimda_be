import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, In } from 'typeorm';
import { Campaign } from '../entities/campaign.entity';
import { ClaimedCode } from '../entities/claimed-code.entity';
import { ItemComment } from '../entities/item-comment.entity';
import { User } from '../entities/user.entity';
import { CreateCampaignDto, UpdateCampaignDto } from './dto/campaign.dto';
import { applyHaversineGeoFilter } from '../common/utils/geo.util';

@Injectable()
export class CampaignsService {
  constructor(
    @InjectRepository(Campaign) private campaignRepo: Repository<Campaign>,
    @InjectRepository(ClaimedCode) private codeRepo: Repository<ClaimedCode>,
    @InjectRepository(ItemComment) private commentRepo: Repository<ItemComment>,
    @InjectRepository(User) private userRepo: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Kampanyaları listeler. GPS koordinatları (lat, lng) ve yarıçap (radiusKm) verildiğinde
   * Haversine formülü ile mesafeyi hesaplar, yarıçapa göre filtreler ve en yakından uzağa sıralar.
   */
  async findAll(
    city?: string,
    lat?: number,
    lng?: number,
    radiusKm?: number,
  ): Promise<ReturnType<Campaign['toObject']>[]> {
    const qb = this.campaignRepo.createQueryBuilder('c');
    const { hasCoords, hasRadius } = applyHaversineGeoFilter(qb, 'c', lat, lng, radiusKm);

    // Yarıçap belirtilmemişse şehir filtresi uygula (andWhere ile mevcut koşulları ezme)
    if (city && city.trim() && !hasRadius) {
      const cleanCity = city.split('-')[0].trim();
      qb.andWhere('(c.city ILIKE :city OR c.city ILIKE :cleanCity)', {
        city: `%${city}%`,
        cleanCity: `%${cleanCity}%`,
      });
    }

    if (hasCoords) {
      const rawAndEntities = await qb.getRawAndEntities();
      return rawAndEntities.entities.map((campaign, idx) => {
        const rawDist = rawAndEntities.raw[idx]?.distance;
        const parsedDist =
          rawDist !== null && rawDist !== undefined
            ? Math.round(Number(rawDist) * 10) / 10
            : null;
        return campaign.toObject(parsedDist);
      });
    }

    const items = await qb.getMany();
    return items.map((i) => i.toObject());
  }

  async findMyCampaigns(userId: string): Promise<any[]> {
    const items = await this.campaignRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return items.map((i) => i.toObject());
  }

  async findOne(id: string): Promise<any> {
    const item = await this.campaignRepo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Kampanya bulunamadı');
    return item.toObject();
  }

  async create(userId: string, data: CreateCampaignDto): Promise<ReturnType<Campaign['toObject']>> {
    const campaign = this.campaignRepo.create({
      title: data.title,
      description: data.description ?? '',
      imageUrl: data.imageUrl ?? null,
      city: data.city ?? '',
      businessName: data.businessName ?? '',
      discountRate: data.discountRate ?? '',
      maxClaims: data.maxClaims ?? null,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      hasCode: data.hasCode ?? true,
      userId,
      likes: [],
      currentClaims: 0,
      commentCount: 0,
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
    });
    const saved = await this.campaignRepo.save(campaign);
    return saved.toObject();
  }

  async update(
    id: string,
    userId: string,
    userRole: string,
    data: UpdateCampaignDto,
  ): Promise<ReturnType<Campaign['toObject']>> {
    const campaign = await this.campaignRepo.findOne({ where: { id } });
    if (!campaign) throw new NotFoundException('Kampanya bulunamadı');

    const canEdit = campaign.userId === userId || ['admin', 'super_admin', 'moderator'].includes(userRole);
    if (!canEdit) throw new ForbiddenException('Bu kampanyayı düzenleme yetkiniz yok');

    // Yalnızca izin verilen alanları güncelle (mass assignment engeli)
    if (data.title !== undefined) campaign.title = data.title;
    if (data.description !== undefined) campaign.description = data.description;
    if (data.imageUrl !== undefined) campaign.imageUrl = data.imageUrl;
    if (data.city !== undefined) campaign.city = data.city;
    if (data.latitude !== undefined) campaign.latitude = data.latitude;
    if (data.longitude !== undefined) campaign.longitude = data.longitude;
    if (data.businessName !== undefined) campaign.businessName = data.businessName;
    if (data.discountRate !== undefined) campaign.discountRate = data.discountRate;
    if (data.maxClaims !== undefined) campaign.maxClaims = data.maxClaims;
    if (data.startDate !== undefined) campaign.startDate = data.startDate ? new Date(data.startDate) : null;
    if (data.endDate !== undefined) campaign.endDate = data.endDate ? new Date(data.endDate) : null;
    if (data.hasCode !== undefined) campaign.hasCode = data.hasCode;

    const updated = await this.campaignRepo.save(campaign);
    return updated.toObject();
  }

  async delete(id: string, userId: string, userRole: string): Promise<{ success: boolean }> {
    const campaign = await this.campaignRepo.findOne({ where: { id } });
    if (!campaign) throw new NotFoundException('Kampanya bulunamadı');

    const canDelete = campaign.userId === userId || ['admin', 'super_admin', 'moderator'].includes(userRole);
    if (!canDelete) throw new ForbiddenException('Bu kampanyayı silme yetkiniz yok');

    await this.campaignRepo.delete(id);
    return { success: true };
  }

  async claimCode(id: string, userId: string): Promise<{ code: string }> {
    // Eşzamanlı kupon taleplerinin maxClaims kotasını aşmaması için pessimistic lock ile transaction kullan
    return this.dataSource.transaction(async (manager) => {
      const campaign = await manager.findOne(Campaign, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!campaign) throw new NotFoundException('Kampanya bulunamadı');

      const existing = await manager.findOne(ClaimedCode, {
        where: { campaignId: id, userId },
      });
      if (existing) {
        return { code: existing.code };
      }

      if (campaign.maxClaims && campaign.currentClaims >= campaign.maxClaims) {
        throw new BadRequestException('Bu kampanyanın kupon kotası dolmuştur.');
      }

      const randomNum = Math.floor(10000 + Math.random() * 90000);
      const codeStr = `CIVAR-${randomNum}`;

      const newCode = manager.create(ClaimedCode, {
        campaignId: id,
        userId,
        code: codeStr,
      });
      await manager.save(ClaimedCode, newCode);

      campaign.currentClaims = (campaign.currentClaims || 0) + 1;
      await manager.save(Campaign, campaign);

      return { code: codeStr };
    });
  }

  async getMyCodes(userId: string): Promise<any[]> {
    const codes = await this.codeRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    const campaignIds = codes.map((c) => c.campaignId);
    const campaigns = campaignIds.length > 0 ? await this.campaignRepo.findBy({ id: In(campaignIds) }) : [];
    const campaignMap = new Map(campaigns.map((c) => [c.id, c.toObject()]));

    return codes.map((c) => ({
      ...c,
      campaign: campaignMap.get(c.campaignId) || null,
    }));
  }

  async toggleLike(id: string, userId: string): Promise<{ liked: boolean; likeCount: number }> {
    const campaign = await this.campaignRepo.findOne({ where: { id } });
    if (!campaign) throw new NotFoundException('Kampanya bulunamadı');

    const likes = campaign.likes || [];
    const index = likes.indexOf(userId);
    let liked = false;

    if (index > -1) {
      likes.splice(index, 1);
    } else {
      likes.push(userId);
      liked = true;
    }

    campaign.likes = likes;
    await this.campaignRepo.save(campaign);

    return { liked, likeCount: likes.length };
  }

  async getComments(id: string): Promise<any[]> {
    const comments = await this.commentRepo.find({
      where: { itemId: id, itemType: 'campaign' },
      order: { createdAt: 'DESC' },
    });

    const userIds = [...new Set(comments.map((c) => c.userId))];
    const users = userIds.length > 0 ? await this.userRepo.findBy({ id: In(userIds) }) : [];
    const userMap = new Map(users.map((u) => [u.id, u]));

    return comments.map((c) => {
      const u = userMap.get(c.userId);
      return {
        id: c.id,
        _id: c.id,
        text: c.text,
        createdAt: c.createdAt,
        user: u
          ? {
              id: u.id,
              _id: u.id,
              fullName: u.fullName,
              profileImage: u.avatar,
            }
          : { id: c.userId, _id: c.userId, fullName: 'Kullanıcı' },
      };
    });
  }

  async addComment(id: string, userId: string, text: string): Promise<any> {
    const campaign = await this.campaignRepo.findOne({ where: { id } });
    if (!campaign) throw new NotFoundException('Kampanya bulunamadı');

    const comment = this.commentRepo.create({
      itemId: id,
      itemType: 'campaign',
      userId,
      text,
    });
    const saved = await this.commentRepo.save(comment);

    campaign.commentCount = (campaign.commentCount || 0) + 1;
    await this.campaignRepo.save(campaign);

    const user = await this.userRepo.findOne({ where: { id: userId } });

    return {
      id: saved.id,
      _id: saved.id,
      text: saved.text,
      createdAt: saved.createdAt,
      user: user
        ? {
            id: user.id,
            _id: user.id,
            fullName: user.fullName,
            profileImage: user.avatar,
          }
        : { id: userId, _id: userId, fullName: 'Kullanıcı' },
    };
  }
}
