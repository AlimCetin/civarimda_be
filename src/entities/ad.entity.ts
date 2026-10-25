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

export enum AdType {
  IMAGE = 'image',
  VIDEO = 'video',
}

export enum AdStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  EXPIRED = 'expired',
  DRAFT = 'draft',
}

@Entity('ads')
@Index(['status', 'startDate', 'endDate'])
@Index(['createdBy'])
@Index(['createdAt'])
export class Ad {
  @PrimaryColumn('varchar', { length: 64 })
  id: string;

  get _id(): string {
    return this.id;
  }

  set _id(val: string) {
    if (val) this.id = val;
  }

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 50 })
  type: AdType;

  @Column({ type: 'varchar', length: 500 })
  mediaUrl: string;

  @Column({ type: 'varchar', length: 500 })
  linkUrl: string;

  @Column({ type: 'text', default: '' })
  description: string;

  @Column({ type: 'varchar', length: 50, default: AdStatus.DRAFT })
  status: AdStatus;

  @Column({ type: 'timestamp with time zone' })
  startDate: Date;

  @Column({ type: 'timestamp with time zone' })
  endDate: Date;

  @Column({ type: 'int', default: 0 })
  clickCount: number;

  @Column({ type: 'int', default: 0 })
  viewCount: number;

  @Column({ type: 'int', default: 0 })
  impressionCount: number;

  @Column({ type: 'varchar', length: 64, nullable: true, default: null })
  createdBy: string | null;

  @Column({ type: 'int', default: 0 })
  maxImpressions: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  budget: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  spentAmount: number;

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
  }

  toObject() {
    return {
      ...this,
      _id: this.id,
    };
  }
}
