import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Place } from '../entities/place.entity';
import { ItemComment } from '../entities/item-comment.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class PlacesService {
  constructor(
    @InjectRepository(Place) private placeRepo: Repository<Place>,
    @InjectRepository(ItemComment) private commentRepo: Repository<ItemComment>,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  /**
   * Mekanları listeler. GPS koordinatları (lat, lng) ve yarıçap (radiusKm) verildiğinde
   * Haversine formülü ile mesafeyi hesaplar, yarıçapa göre filtreler ve en yakından uzağa sıralar.
   */
  async findAll(
    city?: string,
    category?: string,
    lat?: number,
    lng?: number,
    radiusKm?: number,
  ): Promise<any[]> {
    const qb = this.placeRepo.createQueryBuilder('p');

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
      const haversineFormula = `(6371 * acos(least(1.0, greatest(-1.0, cos(radians(:lat)) * cos(radians(p.latitude)) * cos(radians(p.longitude) - radians(:lng)) + sin(radians(:lat)) * sin(radians(p.latitude))))))`;

      qb.addSelect(haversineFormula, 'distance').setParameters({
        lat: userLat,
        lng: userLng,
      });

      if (radius) {
        // Yarıçap filtresi: Sadece koordinatı olan ve mesafe <= radiusKm olan kayıtlar
        qb.andWhere(
          `p.latitude IS NOT NULL AND p.longitude IS NOT NULL AND ${haversineFormula} <= :radius`,
          { radius },
        );
      }

      // En yakındakiler önce gelsin, mesafesi olmayanlar en sona düşsün
      qb.orderBy(
        'CASE WHEN p.latitude IS NOT NULL AND p.longitude IS NOT NULL THEN 0 ELSE 1 END',
        'ASC',
      )
        .addOrderBy('distance', 'ASC')
        .addOrderBy('p.createdAt', 'DESC');
    } else {
      qb.orderBy('p.createdAt', 'DESC');
    }

    // Yarıçap belirtilmemişse şehir filtresi uygula
    if (city && city.trim() && !radius) {
      const cleanCity = city.split('-')[0].trim();
      qb.andWhere('(p.city ILIKE :city OR p.city ILIKE :cleanCity)', {
        city: `%${city}%`,
        cleanCity: `%${cleanCity}%`,
      });
    }

    if (category && category.trim()) {
      qb.andWhere('p.category ILIKE :category', { category: `%${category}%` });
    }

    if (hasCoords) {
      const rawAndEntities = await qb.getRawAndEntities();
      return rawAndEntities.entities.map((place, idx) => {
        const rawDist = rawAndEntities.raw[idx]?.distance;
        const parsedDist =
          rawDist !== null && rawDist !== undefined
            ? Math.round(Number(rawDist) * 10) / 10
            : null;
        return place.toObject(parsedDist);
      });
    } else {
      const items = await qb.getMany();
      return items.map((i) => i.toObject());
    }
  }

  async findMyPlaces(userId: string): Promise<any[]> {
    const items = await this.placeRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return items.map((i) => i.toObject());
  }

  async findOne(id: string): Promise<any> {
    const item = await this.placeRepo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Yer/İşletme bulunamadı');
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

    const place = this.placeRepo.create({
      ...data,
      name: data.title || data.name || 'İsimsiz Yer',
      userId,
      likes: [],
      images: data.images || (data.imageUrl ? [data.imageUrl] : []),
      commentCount: 0,
      latitude: lat,
      longitude: lng,
    } as Partial<Place>);
    const saved = await this.placeRepo.save(place as Place);
    return (saved as Place).toObject();
  }

  async update(id: string, userId: string, userRole: string, data: any): Promise<any> {
    const place = await this.placeRepo.findOne({ where: { id } });
    if (!place) throw new NotFoundException('Yer/İşletme bulunamadı');

    const canEdit = place.userId === userId || ['admin', 'super_admin', 'moderator'].includes(userRole);
    if (!canEdit) throw new ForbiddenException('Bu yeri düzenleme yetkiniz yok');

    if (data.title && !data.name) data.name = data.title;
    if (data.latitude !== undefined) {
      data.latitude =
        data.latitude !== null && data.latitude !== '' ? Number(data.latitude) : null;
    }
    if (data.longitude !== undefined) {
      data.longitude =
        data.longitude !== null && data.longitude !== '' ? Number(data.longitude) : null;
    }

    Object.assign(place, data);
    const updated = await this.placeRepo.save(place);
    return updated.toObject();
  }

  async delete(id: string, userId: string, userRole: string): Promise<{ success: boolean }> {
    const place = await this.placeRepo.findOne({ where: { id } });
    if (!place) throw new NotFoundException('Yer/İşletme bulunamadı');

    const canDelete = place.userId === userId || ['admin', 'super_admin', 'moderator'].includes(userRole);
    if (!canDelete) throw new ForbiddenException('Bu yeri silme yetkiniz yok');

    await this.placeRepo.delete(id);
    return { success: true };
  }

  async toggleLike(id: string, userId: string): Promise<{ liked: boolean; likeCount: number }> {
    const place = await this.placeRepo.findOne({ where: { id } });
    if (!place) throw new NotFoundException('Yer/İşletme bulunamadı');

    const likes = place.likes || [];
    const index = likes.indexOf(userId);
    let liked = false;

    if (index > -1) {
      likes.splice(index, 1);
    } else {
      likes.push(userId);
      liked = true;
    }

    place.likes = likes;
    await this.placeRepo.save(place);

    return { liked, likeCount: likes.length };
  }

  async getComments(id: string): Promise<any[]> {
    const comments = await this.commentRepo.find({
      where: { itemId: id, itemType: 'place' },
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
    const place = await this.placeRepo.findOne({ where: { id } });
    if (!place) throw new NotFoundException('Yer/İşletme bulunamadı');

    const comment = this.commentRepo.create({
      itemId: id,
      itemType: 'place',
      userId,
      text,
    });
    const saved = await this.commentRepo.save(comment);

    place.commentCount = (place.commentCount || 0) + 1;
    await this.placeRepo.save(place);

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
