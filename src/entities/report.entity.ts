import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum ReportType {
  USER = 'user',
  POST = 'post',
  COMMENT = 'comment',
  MESSAGE = 'message',
}

export enum ReportReason {
  SPAM = 'spam',
  HARASSMENT = 'harassment',
  INAPPROPRIATE_CONTENT = 'inappropriate_content',
  COPYRIGHT = 'copyright',
  FAKE_NEWS = 'fake_news',
  HATE_SPEECH = 'hate_speech',
  OTHER = 'other',
}

export enum ReportStatus {
  PENDING = 'pending',
  IN_REVIEW = 'in_review',
  RESOLVED = 'resolved',
  REJECTED = 'rejected',
}

export enum ReportPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

@Entity('reports')
@Index(['status', 'priority', 'createdAt'])
@Index(['reportedId', 'type'])
@Index(['reporterId'])
@Index(['reviewedBy'])
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 64 })
  reporterId: string;

  @Column({ type: 'varchar', length: 64 })
  reportedId: string;

  @Column({ type: 'varchar', length: 50 })
  type: ReportType;

  @Column({ type: 'varchar', length: 50 })
  reason: ReportReason;

  @Column({ type: 'text', default: '' })
  description: string;

  @Column({ type: 'varchar', length: 50, default: ReportStatus.PENDING })
  status: ReportStatus;

  @Column({ type: 'varchar', length: 50, default: ReportPriority.MEDIUM })
  priority: ReportPriority;

  @Column({ type: 'varchar', length: 64, nullable: true, default: null })
  reviewedBy: string | null;

  @Column({ type: 'timestamp with time zone', nullable: true, default: null })
  reviewedAt: Date | null;

  @Column({ type: 'text', default: '' })
  adminNote: string;

  @Column({ type: 'int', default: 1 })
  reportCount: number;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;

  toObject() {
    return {
      ...this,
      id: this.id,
      _id: this.id,
    };
  }
}
