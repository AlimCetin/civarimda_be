import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  AfterLoad,
} from 'typeorm';

@Entity('campaigns')
@Index(['city'])
@Index(['userId'])
@Index(['createdAt'])
export class Campaign {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 64 })
  userId: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', default: '' })
  description: string;

  @Column({ type: 'varchar', length: 500, nullable: true, default: null })
  imageUrl: string | null;

  @Column({ type: 'varchar', length: 100, default: '' })
  city: string;

  @Column({ type: 'varchar', length: 255, default: '' })
  businessName: string;

  @Column({ type: 'varchar', length: 50, default: '' })
  discountRate: string;

  @Column({ type: 'int', nullable: true, default: null })
  maxClaims: number | null;

  @Column({ type: 'int', default: 0 })
  currentClaims: number;

  @Column({ type: 'timestamp with time zone', nullable: true, default: null })
  startDate: Date | null;

  @Column({ type: 'timestamp with time zone', nullable: true, default: null })
  endDate: Date | null;

  @Column({ type: 'boolean', default: true })
  hasCode: boolean;

  @Column({ type: 'text', array: true, default: '{}' })
  likes: string[];

  @Column({ type: 'int', default: 0 })
  commentCount: number;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;

  @AfterLoad()
  populateVirtuals() {
    if (!this.likes) this.likes = [];
  }

  toObject() {
    return {
      ...this,
      id: this.id,
      _id: this.id,
      createdBy: this.userId,
      likes: this.likes || [],
    };
  }
}
