import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('notifications')
@Index(['userId', 'createdAt'])
@Index(['userId', 'read'])
@Index(['fromUserId'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 64 })
  userId: string;

  @Column({ type: 'varchar', length: 64 })
  fromUserId: string;

  @Column({ type: 'varchar', length: 50 })
  type: string;

  @Column({ type: 'varchar', length: 64, nullable: true, default: null })
  postId?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true, default: null })
  postOwnerName?: string | null;

  @Column({ type: 'boolean', default: false })
  isFollowerNotification: boolean;

  @Column({ type: 'boolean', default: false })
  read: boolean;

  @Column({ type: 'timestamp with time zone', nullable: true, default: null })
  deletedAt: Date | null;

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
