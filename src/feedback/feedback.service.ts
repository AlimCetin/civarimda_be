import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Feedback, FeedbackStatus, FeedbackType } from '../entities/feedback.entity';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectRepository(Feedback)
    private feedbackRepo: Repository<Feedback>,
  ) {}

  async create(data: {
    userId?: string;
    userName?: string;
    userEmail?: string;
    rating?: number;
    type?: FeedbackType;
    title?: string;
    message: string;
    deviceInfo?: string;
  }): Promise<Feedback> {
    const feedback = this.feedbackRepo.create({
      userId: data.userId || null,
      userName: data.userName || 'Anonim Kullanıcı',
      userEmail: data.userEmail || '',
      rating: data.rating !== undefined ? Math.min(5, Math.max(1, Number(data.rating))) : 5,
      type: data.type || 'suggestion',
      title: data.title || '',
      message: data.message,
      deviceInfo: data.deviceInfo || '',
      status: 'pending',
    });

    return this.feedbackRepo.save(feedback);
  }

  async findAll(status?: FeedbackStatus, type?: FeedbackType): Promise<Feedback[]> {
    const qb = this.feedbackRepo.createQueryBuilder('f').orderBy('f.createdAt', 'DESC');

    if (status) {
      qb.andWhere('f.status = :status', { status });
    }

    if (type) {
      qb.andWhere('f.type = :type', { type });
    }

    return qb.getMany();
  }

  async updateStatus(
    id: string,
    status: FeedbackStatus,
    adminNote?: string,
  ): Promise<Feedback> {
    const feedback = await this.feedbackRepo.findOne({ where: { id } });
    if (!feedback) {
      throw new NotFoundException('Geri bildirim kaydı bulunamadı.');
    }

    feedback.status = status;
    if (adminNote !== undefined) {
      feedback.adminNote = adminNote;
    }

    return this.feedbackRepo.save(feedback);
  }

  async getStats(): Promise<{
    totalCount: number;
    avgRating: number;
    suggestionCount: number;
    bugCount: number;
    ratingCount: number;
    pendingCount: number;
  }> {
    const totalCount = await this.feedbackRepo.count();
    const pendingCount = await this.feedbackRepo.count({ where: { status: 'pending' } });
    const suggestionCount = await this.feedbackRepo.count({ where: { type: 'suggestion' } });
    const bugCount = await this.feedbackRepo.count({ where: { type: 'bug' } });
    const ratingCount = await this.feedbackRepo.count({ where: { type: 'rating' } });

    const avgRaw = await this.feedbackRepo
      .createQueryBuilder('f')
      .select('AVG(f.rating)', 'avg')
      .getRawOne();

    const avgRating = avgRaw?.avg ? Math.round(Number(avgRaw.avg) * 10) / 10 : 5.0;

    return {
      totalCount,
      avgRating,
      suggestionCount,
      bugCount,
      ratingCount,
      pendingCount,
    };
  }
}
