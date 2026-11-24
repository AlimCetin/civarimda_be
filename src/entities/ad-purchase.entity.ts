import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
}

@Entity('ad_purchases')
@Index(['userId', 'paymentStatus'])
export class AdPurchase {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 64 })
  userId: string;

  @Column({ type: 'varchar', length: 64 })
  packageId: string;

  @Column({ type: 'varchar', length: 64, nullable: true, default: null })
  adId: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amountPaid: number;

  @Column({ type: 'varchar', length: 10, default: 'TRY' })
  currency: string;

  @Column({ type: 'varchar', length: 32, default: PaymentStatus.PAID })
  paymentStatus: PaymentStatus;

  @Column({ type: 'varchar', length: 120, nullable: true, default: null })
  paymentReference: string | null;

  @Column({ type: 'int', default: 1 })
  remainingAdCredits: number;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}

