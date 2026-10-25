import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('claimed_codes')
@Index(['userId'])
@Index(['campaignId'])
@Index(['code'], { unique: true })
export class ClaimedCode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 64 })
  userId: string;

  @Column({ type: 'varchar', length: 64 })
  campaignId: string;

  @Column({ type: 'varchar', length: 64, unique: true })
  code: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;
}
