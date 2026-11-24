import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('business_schedules')
@Index(['businessUserId', 'dayOfWeek'], { unique: true })
export class BusinessSchedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 64 })
  businessUserId: string;

  // 0: Pazar, 1: Pazartesi ... 6: Cumartesi
  @Column({ type: 'int' })
  dayOfWeek: number;

  @Column({ type: 'boolean', default: true })
  isOpen: boolean;

  @Column({ type: 'varchar', length: 5, default: '09:00' })
  openTime: string;

  @Column({ type: 'varchar', length: 5, default: '20:00' })
  closeTime: string;

  @Column({ type: 'varchar', length: 5, nullable: true, default: '12:30' })
  breakStart: string | null;

  @Column({ type: 'varchar', length: 5, nullable: true, default: '13:30' })
  breakEnd: string | null;

  @Column({ type: 'int', default: 30 })
  slotIntervalMinutes: number;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}

