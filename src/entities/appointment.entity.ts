import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum AppointmentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

@Entity('appointments')
@Index(['businessUserId', 'appointmentDate', 'status'])
@Index(['customerId', 'createdAt'])
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 64 })
  businessUserId: string;

  @Column({ type: 'varchar', length: 64 })
  customerId: string;

  @Column({ type: 'varchar', length: 64 })
  serviceId: string;

  // Randevu anındaki hizmet adı, süre ve fiyat anlık görüntüsü (sonradan fiyat değişse bile geçmiş bozulmaz)
  @Column({ type: 'varchar', length: 150 })
  serviceName: string;

  @Column({ type: 'int' })
  durationMinutes: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  // YYYY-MM-DD formatında randevu tarihi
  @Column({ type: 'varchar', length: 10 })
  appointmentDate: string;

  // HH:mm formatında başlangıç ve bitiş saatleri
  @Column({ type: 'varchar', length: 5 })
  startTime: string;

  @Column({ type: 'varchar', length: 5 })
  endTime: string;

  @Column({ type: 'varchar', length: 20, default: AppointmentStatus.PENDING })
  status: AppointmentStatus;

  @Column({ type: 'varchar', length: 500, default: '' })
  requestedTreatment: string;

  @Column({ type: 'varchar', length: 500, default: '' })
  customerNote: string;

  @Column({ type: 'varchar', length: 500, default: '' })
  businessNote: string;

  @Column({ type: 'varchar', length: 64, nullable: true, default: null })
  cancelledBy: string | null;

  @Column({ type: 'varchar', length: 300, nullable: true, default: null })
  cancelReason: string | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}

