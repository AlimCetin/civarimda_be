import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('messages')
@Index(['conversationId', 'createdAt'])
@Index(['senderId'])
@Index(['read'])
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 64 })
  conversationId: string;

  @Column({ type: 'varchar', length: 64 })
  senderId: string;

  @Column({ type: 'text' })
  text: string;

  @Column({ type: 'boolean', default: false })
  read: boolean;

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
