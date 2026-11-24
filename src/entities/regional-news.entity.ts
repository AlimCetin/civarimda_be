import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum NewsCategory {
  NEWS = 'news',
  ANNOUNCEMENT = 'announcement',
  EMERGENCY = 'emergency',
}

export enum NewsScope {
  REGIONAL = 'regional',
  NATIONAL = 'national',
}

@Entity('regional_news')
@Index(['isActive', 'scope', 'city'])
@Index(['isPinned', 'createdAt'])
export class RegionalNews {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 500, default: '' })
  summary: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'varchar', length: 32, default: NewsCategory.NEWS })
  category: NewsCategory;

  @Column({ type: 'varchar', length: 32, default: NewsScope.REGIONAL })
  scope: NewsScope;

  @Column({ type: 'varchar', length: 100, nullable: true, default: null })
  city: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true, default: null })
  imageUrl: string | null;

  @Column({ type: 'boolean', default: false })
  isPinned: boolean;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'varchar', length: 64 })
  publishedBy: string;

  @Column({ type: 'timestamp with time zone', nullable: true, default: null })
  expiresAt: Date | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}

