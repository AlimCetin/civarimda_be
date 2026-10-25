import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Campaign } from '../entities/campaign.entity';
import { ClaimedCode } from '../entities/claimed-code.entity';
import { ItemComment } from '../entities/item-comment.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class CampaignsService {
  constructor(
    @InjectRepository(Campaign) private campaignRepo: Repository<Campaign>,
    @InjectRepository(ClaimedCode) private codeRepo: Repository<ClaimedCode>,
    @InjectRepository(ItemComment) private commentRepo: Repository<ItemComment>,
    @InjectRepository(User) private userRepo: Repository<User>,
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
  ): Promise<any[]> {
    const qb = this.campaignRepo.createQueryBuilder('c');

    const hasCoords =
      lat !== undefined &&
      lat !== null &&
      !isNaN(Number(lat)) &&
      lng !== undefined &&
      lng !== null &&
      !isNaN(Number(lng));

    const userLat = hasCoords ? Number(lat) : null;
    const userLng = hasCoords ? Number(lng) : null;
    const radius =
      radiusKm !== undefined &&
      radiusKm !== null &&
      !isNaN(Number(radiusKm)) &&
      Number(radiusKm) > 0
        ? Number(radiusKm)
        : null;

    if (hasCoords && userLat !== null && userLng !== null) {
      // PostgreSQL Haversine formülü (km cinsinden)
      const haversineFormula = `(6371 * acos(least(1.0, greatest(-1.0, cos(radians(:lat)) * cos(radians(c.latitude)) * cos(radians(c.longitude) - radians(:lng)) + sin(radians(:lat)) * sin(radians(c.latitude))))))`;

      qb.addSelect(haversineFormula, 'distance').setParameters({
        lat: userLat,
        lng: userLng,
      });

      if (radius) {
        // Yarıçap filtresi: Sadece koordinatı olan ve mesafe <= radiusKm olan kayıtlar
        qb.andWhere(
          `c.latitude IS NOT NULL AND c.longitude IS NOT NULL AND ${haversineFormula} <= :radius`,
          { radius },
        );
      }

      // En yakındakiler önce gelsin, mesafesi olmayanlar en sona düşsün
      qb.orderBy(
        'CASE WHEN c.latitude IS NOT NULL AND c.longitude IS NOT NULL THEN 0 ELSE 1 END',
        'ASC',
      )
        .addOrderBy('distance', 'ASC')
        .addOrderBy('c.createdAt', 'DESC');
    } else {
      qb.orderBy('c.createdAt', 'DESC');
    }

    // Yarıçap belirtilmemişse şehir filtresi uygula
    if (city && city.trim() && !radius) {
      const cleanCity = city.split('-')[0].trim();
      qb.where('c.city ILIKE :city OR c.city ILIKE :cleanCity', {
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
    } else {
      const items = await qb.getMany();
      return items.map((i) => i.toObject());
    }
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

  async create(userId: string, data: any): Promise<any> {
    const lat =
      data.latitude !== undefined && data.latitude !== null && data.latitude !== ''
        ? Number(data.latitude)
        : null;
    const lng =
      data.longitude !== undefined && data.longitude !== null && data.longitude !== ''
        ? Number(data.longitude)
        : null;

    const campaign = this.campaignRepo.create({
      ...data,
      userId,
      likes: [],
      currentClaims: 0,
      commentCount: 0,
      latitude: lat,
      longitude: lng,
    });
    const saved = await this.campaignRepo.save(campaign as unknown as Campaign);
    return (saved as Campaign).toObject();
  }

  async update(id: string, userId: string, userRole: string, data: any): Promise<any> {
    const campaign = await this.campaignRepo.findOne({ where: { id } });
    if (!campaign) throw new NotFoundException('Kampanya bulunamadı');

    const canEdit = campaign.userId === userId || ['admin', 'super_admin', 'moderator'].includes(userRole);
    if (!canEdit) throw new ForbiddenException('Bu kampanyayı düzenleme yetkiniz yok');

    if (data.latitude !== undefined) {
      data.latitude =
        data.latitude !== null && data.latitude !== '' ? Number(data.latitude) : null;
    }
    if (data.longitude !== undefined) {
      data.longitude =
        data.longitude !== null && data.longitude !== '' ? Number(data.longitude) : null;
    }

    Object.assign(campaign, data);
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
    const campaign = await this.campaignRepo.findOne({ where: { id } });
    if (!campaign) throw new NotFoundException('Kampanya bulunamadı');

    if (campaign.maxClaims && campaign.currentClaims >= campaign.maxClaims) {
      throw new BadRequestException('Bu kampanyanın kupon kotası dolmuştur.');
    }

    // Check if user already claimed a code for this campaign
    const existing = await this.codeRepo.findOne({
      where: { campaignId: id, userId },
    });
    if (existing) {
      return { code: existing.code };
    }

    // Generate unique random code (e.g. CIVAR-84729)
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const codeStr = `CIVAR-${randomNum}`;

    const newCode = this.codeRepo.create({
      campaignId: id,
      userId,
      code: codeStr,
    });
    await this.codeRepo.save(newCode);

    // Increment claims
    campaign.currentClaims = (campaign.currentClaims || 0) + 1;
    await this.campaignRepo.save(campaign);

    return { code: codeStr };
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
