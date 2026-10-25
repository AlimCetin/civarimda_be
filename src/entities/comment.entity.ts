import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('comments')
@Index(['postId', 'createdAt'])
@Index(['userId'])
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 64 })
  postId: string;

  @Column({ type: 'varchar', length: 64 })
  userId: string;

  @Column({ type: 'text' })
  text: string;

  @Column({ type: 'timestamp with time zone', nullable: true, default: null })
  deletedAt: Date | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;

  toObject() {
    return {
      ...this,
      id: this.id,
      _id: this.id,
    };
  }
}
