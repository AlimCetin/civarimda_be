import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  BeforeInsert,
  AfterLoad,
} from 'typeorm';
import { randomUUID } from 'crypto';

@Entity('messages')
@Index(['conversationId', 'createdAt'])
@Index(['senderId'])
@Index(['read'])
export class Message {
  @PrimaryColumn('varchar', { length: 64 })
  id: string;

  get _id(): string {
    return this.id;
  }

  set _id(val: string) {
    if (val) this.id = val;
  }

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

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = randomUUID();
    }
  }

  @AfterLoad()
  populateVirtuals() {
    (this as any)._id = this.id;
  }

  toObject() {
    return {
      ...this,
      _id: this.id,
    };
  }
}
