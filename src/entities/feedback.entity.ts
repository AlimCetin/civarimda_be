import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export type FeedbackType = 'rating' | 'suggestion' | 'bug' | 'other';
export type FeedbackStatus = 'pending' | 'reviewed' | 'resolved' | 'archived';

@Entity('feedbacks')
@Index(['type'])
@Index(['status'])
@Index(['createdAt'])
export class Feedback {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 64, nullable: true, default: null })
  userId: string | null;

  @Column({ type: 'varchar', length: 150, default: 'Anonim Kullanıcı' })
  userName: string;

  @Column({ type: 'varchar', length: 150, default: '' })
  userEmail: string;

  @Column({ type: 'int', default: 5 })
  rating: number; // 1 - 5 yıldız

  @Column({ type: 'varchar', length: 50, default: 'suggestion' })
  type: FeedbackType;

  @Column({ type: 'varchar', length: 255, default: '' })
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'varchar', length: 255, default: '' })
  deviceInfo: string; // Örn: Android 13 - App v1.0.3

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status: FeedbackStatus;

  @Column({ type: 'text', nullable: true, default: null })
  adminNote: string | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
