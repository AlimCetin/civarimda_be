"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlacesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const place_entity_1 = require("../entities/place.entity");
const item_comment_entity_1 = require("../entities/item-comment.entity");
const user_entity_1 = require("../entities/user.entity");
let PlacesService = class PlacesService {
    placeRepo;
    commentRepo;
    userRepo;
    constructor(placeRepo, commentRepo, userRepo) {
        this.placeRepo = placeRepo;
        this.commentRepo = commentRepo;
        this.userRepo = userRepo;
    }
    async findAll(city, category) {
        const qb = this.placeRepo.createQueryBuilder('p').orderBy('p.createdAt', 'DESC');
        if (city && city.trim()) {
            const cleanCity = city.split('-')[0].trim();
            qb.andWhere('(p.city ILIKE :city OR p.city ILIKE :cleanCity)', {
                city: `%${city}%`,
                cleanCity: `%${cleanCity}%`,
            });
        }
        if (category && category.trim()) {
            qb.andWhere('p.category ILIKE :category', { category: `%${category}%` });
        }
        const items = await qb.getMany();
        return items.map((i) => i.toObject());
    }
    async findMyPlaces(userId) {
        const items = await this.placeRepo.find({
            where: { userId },
            order: { createdAt: 'DESC' },
        });
        return items.map((i) => i.toObject());
    }
    async findOne(id) {
        const item = await this.placeRepo.findOne({ where: { id } });
        if (!item)
            throw new common_1.NotFoundException('Yer/İşletme bulunamadı');
        return item.toObject();
    }
    async create(userId, data) {
        const place = this.placeRepo.create({
            ...data,
            name: data.title || data.name || 'İsimsiz Yer',
            userId,
            likes: [],
            images: data.images || (data.imageUrl ? [data.imageUrl] : []),
            commentCount: 0,
        });
        const saved = await this.placeRepo.save(place);
        return saved.toObject();
    }
    async update(id, userId, userRole, data) {
        const place = await this.placeRepo.findOne({ where: { id } });
        if (!place)
            throw new common_1.NotFoundException('Yer/İşletme bulunamadı');
        const canEdit = place.userId === userId || ['admin', 'super_admin', 'moderator'].includes(userRole);
        if (!canEdit)
            throw new common_1.ForbiddenException('Bu yeri düzenleme yetkiniz yok');
        if (data.title && !data.name)
            data.name = data.title;
        Object.assign(place, data);
        const updated = await this.placeRepo.save(place);
        return updated.toObject();
    }
    async delete(id, userId, userRole) {
        const place = await this.placeRepo.findOne({ where: { id } });
        if (!place)
            throw new common_1.NotFoundException('Yer/İşletme bulunamadı');
        const canDelete = place.userId === userId || ['admin', 'super_admin', 'moderator'].includes(userRole);
        if (!canDelete)
            throw new common_1.ForbiddenException('Bu yeri silme yetkiniz yok');
        await this.placeRepo.delete(id);
        return { success: true };
    }
    async toggleLike(id, userId) {
        const place = await this.placeRepo.findOne({ where: { id } });
        if (!place)
            throw new common_1.NotFoundException('Yer/İşletme bulunamadı');
        const likes = place.likes || [];
        const index = likes.indexOf(userId);
        let liked = false;
        if (index > -1) {
            likes.splice(index, 1);
        }
        else {
            likes.push(userId);
            liked = true;
        }
        place.likes = likes;
        await this.placeRepo.save(place);
        return { liked, likeCount: likes.length };
    }
    async getComments(id) {
        const comments = await this.commentRepo.find({
            where: { itemId: id, itemType: 'place' },
            order: { createdAt: 'DESC' },
        });
        const userIds = [...new Set(comments.map((c) => c.userId))];
        const users = userIds.length > 0 ? await this.userRepo.findBy({ id: (0, typeorm_2.In)(userIds) }) : [];
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
    async addComment(id, userId, text) {
        const place = await this.placeRepo.findOne({ where: { id } });
        if (!place)
            throw new common_1.NotFoundException('Yer/İşletme bulunamadı');
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
};
exports.PlacesService = PlacesService;
exports.PlacesService = PlacesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(place_entity_1.Place)),
    __param(1, (0, typeorm_1.InjectRepository)(item_comment_entity_1.ItemComment)),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], PlacesService);
//# sourceMappingURL=places.service.js.map