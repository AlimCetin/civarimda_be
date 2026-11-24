import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export type AppPlatform = 'all' | 'android' | 'ios';

@Entity('app_versions')
@Index(['platform', 'isActive', 'createdAt'])
export class AppVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 30 })
  version: string;

  @Column({ type: 'varchar', length: 20, default: 'all' })
  platform: AppPlatform;

  @Column({ type: 'varchar', length: 150, default: 'Yeni Güncelleme' })
  title: string;

  @Column({ type: 'text', default: '' })
  releaseNotes: string;

  @Column({ type: 'boolean', default: false })
  forceUpdate: boolean;

  @Column({ type: 'varchar', length: 30, nullable: true, default: null })
  minSupportedVersion: string | null;

  @Column({
    type: 'varchar',
    length: 500,
    default: 'https://play.google.com/store/apps/details?id=com.civarimda.app',
  })
  androidStoreUrl: string;

  @Column({
    type: 'varchar',
    length: 500,
    default: 'https://apps.apple.com/app/idYOUR_APP_ID',
  })
  iosStoreUrl: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'varchar', length: 64, nullable: true, default: null })
  publishedBy: string | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}

