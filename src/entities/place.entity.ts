import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  AfterLoad,
} from 'typeorm';

@Entity('places')
@Index(['city'])
@Index(['category'])
@Index(['userId'])
@Index(['createdAt'])
export class Place {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 64 })
  userId: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', default: '' })
  description: string;

  @Column({ type: 'varchar', length: 500, nullable: true, default: null })
  imageUrl: string | null;

  @Column({ type: 'text', array: true, default: '{}' })
  images: string[];

  @Column({ type: 'varchar', length: 100, default: '' })
  city: string;

  @Column({ type: 'varchar', length: 255, default: '' })
  businessName: string;

  @Column({ type: 'varchar', length: 100, default: '' })
  category: string;

  @Column({ type: 'text', default: '' })
  address: string;

  @Column({ type: 'varchar', length: 50, default: '' })
  phone: string;

  @Column({ type: 'varchar', length: 100, default: '' })
  workingHours: string;

  @Column({ type: 'varchar', length: 50, default: 'Ücretsiz' })
  entryFee: string;

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
    if (!this.images) this.images = [];
  }

  toObject() {
    return {
      ...this,
      id: this.id,
      _id: this.id,
      title: this.name,
      createdBy: this.userId,
      likes: this.likes || [],
      images: this.images || [],
    };
  }
}
