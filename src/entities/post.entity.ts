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

@Entity('posts')
@Index(['userId', 'createdAt'])
@Index(['createdAt'])
export class Post {
  @PrimaryColumn('varchar', { length: 64 })
  id: string;

  get _id(): string {
    return this.id;
  }

  set _id(val: string) {
    if (val) this.id = val;
  }

  @Column({ type: 'varchar', length: 64 })
  userId: string;

  @Column({ type: 'varchar', length: 500, nullable: true, default: null })
  image: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true, default: null })
  video?: string | null;

  @Column({ type: 'text', default: '' })
  caption: string;

  @Column({ type: 'text', array: true, default: '{}' })
  likes: string[];

  @Column({ type: 'int', default: 0 })
  commentCount: number;

  @Column({ type: 'boolean', default: false })
  isHidden: boolean;

  @Column({ type: 'boolean', default: false })
  isPrivate: boolean;

  @Column({ type: 'text', array: true, default: '{}' })
  hiddenFromFollowers: string[];

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
    if (!this.likes) this.likes = [];
    if (!this.hiddenFromFollowers) this.hiddenFromFollowers = [];
  }

  toObject() {
    return {
      ...this,
      _id: this.id,
      likes: this.likes || [],
      hiddenFromFollowers: this.hiddenFromFollowers || [],
    };
  }
}
