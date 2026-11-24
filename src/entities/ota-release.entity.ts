import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export type OtaPlatform = 'android' | 'ios';
export type OtaChannel = 'production' | 'staging';

@Entity('ota_releases')
@Index(['platform', 'channel', 'targetAppVersion', 'isEnabled'])
@Index(['createdAt'])
export class OtaRelease {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20 })
  platform: OtaPlatform;

  @Column({ type: 'varchar', length: 30, default: 'production' })
  channel: OtaChannel;

  @Column({ type: 'varchar', length: 30 })
  targetAppVersion: string;

  @Column({ type: 'varchar', length: 500 })
  bundleUrl: string;

  @Column({ type: 'varchar', length: 128 })
  fileHash: string;

  @Column({ type: 'text' })
  rsaSignature: string;

  @Column({ type: 'bigint', default: '0' })
  fileSizeBytes: string;

  @Column({ type: 'text', default: '' })
  releaseNotes: string;

  @Column({ type: 'boolean', default: false })
  shouldForceUpdate: boolean;

  @Column({ type: 'int', default: 100 })
  rolloutPercentage: number;

  @Column({ type: 'boolean', default: true })
  isEnabled: boolean;

  @Column({ type: 'boolean', default: false })
  isRollback: boolean;

  @Column({ type: 'int', default: 0 })
  downloadCount: number;

  @Column({ type: 'varchar', length: 64, nullable: true, default: null })
  publishedBy: string | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}

