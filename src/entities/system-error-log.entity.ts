import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export type ErrorSource = 'backend' | 'mobile' | 'admin';
export type ErrorSeverity = 'warning' | 'error' | 'fatal';

@Entity('system_error_logs')
@Index(['source', 'isResolved'])
@Index(['createdAt'])
export class SystemErrorLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20 })
  source: ErrorSource;

  @Column({ type: 'varchar', length: 20, default: 'error' })
  severity: ErrorSeverity;

  @Column({ type: 'varchar', length: 1000 })
  message: string;

  @Column({ type: 'text', nullable: true, default: null })
  stack: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true, default: null })
  path: string | null;

  @Column({ type: 'varchar', length: 16, nullable: true, default: null })
  method: string | null;

  @Column({ type: 'int', nullable: true, default: null })
  statusCode: number | null;

  @Column({ type: 'varchar', length: 64, nullable: true, default: null })
  userId: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true, default: null })
  deviceInfo: string | null;

  @Column({ type: 'boolean', default: false })
  isResolved: boolean;

  @Column({ type: 'varchar', length: 64, nullable: true, default: null })
  resolvedBy: string | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;
}

