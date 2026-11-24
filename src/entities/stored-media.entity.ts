import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('stored_media')
@Index(['provider'])
@Index(['createdAt'])
export class StoredMedia {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 500, unique: true })
  key: string;

  @Column({ type: 'varchar', length: 20, default: 'local' })
  provider: 'local' | 'r2';

  @Column({ type: 'varchar', length: 100, default: 'application/octet-stream' })
  mimeType: string;

  @Column({ type: 'bigint' })
  sizeBytes: string;

  @Column({ type: 'varchar', length: 500 })
  url: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;
}

