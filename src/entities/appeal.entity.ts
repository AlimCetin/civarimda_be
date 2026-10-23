import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  BeforeInsert,
  AfterLoad,
} from 'typeorm';
import { randomUUID } from 'crypto';

export enum AppealStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('appeals')
@Index(['userId', 'status', 'createdAt'])
@Index(['reviewedBy'])
@Index(['status', 'createdAt'])
export class Appeal {
  @PrimaryColumn('varchar', { length: 64 })
  id: string;

  get _id(): string {
    return this.id;
  }

  @Column({ type: 'varchar', length: 64 })
  userId: string;

  @Column({ type: 'varchar', length: 64 })
  banLogId: string;

  @Column({ type: 'text' })
  reason: string;

  @Column({ type: 'varchar', length: 50, default: AppealStatus.PENDING })
  status: AppealStatus;

  @Column({ type: 'varchar', length: 64, nullable: true, default: null })
  reviewedBy: string | null;

  @Column({ type: 'timestamp with time zone', nullable: true, default: null })
  reviewedAt: Date | null;

  @Column({ type: 'text', default: '' })
  adminResponse: string;

  @Column({ type: 'jsonb', default: '[]' })
  conversation: Array<{
    senderId: string;
    message: string;
    createdAt: Date;
  }>;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = randomUUID();
    }
  }

  @AfterLoad()
  populateVirtuals() {
    (this as any)._id = this.id;
    if (!this.conversation) this.conversation = [];
  }

  toObject() {
    return {
      ...this,
      _id: this.id,
      conversation: this.conversation || [],
    };
  }
}
