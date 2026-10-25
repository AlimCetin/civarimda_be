import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  AfterLoad,
} from 'typeorm';

@Entity('conversations')
@Index(['lastMessageAt'])
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', array: true, default: '{}' })
  participants: string[];

  @Column({ type: 'varchar', length: 64, nullable: true, default: null })
  lastMessage: string | null;

  @Column({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  lastMessageAt: Date;

  @Column({ type: 'timestamp with time zone', nullable: true, default: null })
  deletedAt: Date | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;

  @AfterLoad()
  populateVirtuals() {
    if (!this.participants) this.participants = [];
  }

  toObject() {
    return {
      ...this,
      id: this.id,
      _id: this.id,
      participants: this.participants || [],
    };
  }
}
