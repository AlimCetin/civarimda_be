import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  AfterLoad,
} from 'typeorm';

export enum ActivityType {
  USER_BANNED = 'user_banned',
  USER_UNBANNED = 'user_unbanned',
  USER_WARNED = 'user_warned',
  POST_DELETED = 'post_deleted',
  POST_HIDDEN = 'post_hidden',
  REPORT_RESOLVED = 'report_resolved',
  REPORT_REJECTED = 'report_rejected',
  AD_CREATED = 'ad_created',
  AD_UPDATED = 'ad_updated',
  AD_DELETED = 'ad_deleted',
  ROLE_CHANGED = 'role_changed',
}

@Entity('activity_logs')
@Index(['adminId', 'createdAt'])
@Index(['targetUserId', 'createdAt'])
@Index(['activityType', 'createdAt'])
@Index(['createdAt'])
export class ActivityLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 64 })
  adminId: string;

  @Column({ type: 'varchar', length: 50 })
  activityType: ActivityType;

  @Column({ type: 'varchar', length: 64, nullable: true, default: null })
  targetUserId: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true, default: null })
  targetPostId: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true, default: null })
  targetReportId: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true, default: null })
  targetAdId: string | null;

  @Column({ type: 'text', default: '' })
  description: string;

  @Column({ type: 'jsonb', default: '{}' })
  metadata: Record<string, any>;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;

  @AfterLoad()
  populateVirtuals() {
    if (!this.metadata) this.metadata = {};
  }

  toObject() {
    return {
      ...this,
      id: this.id,
      _id: this.id,
      metadata: this.metadata || {},
    };
  }
}
