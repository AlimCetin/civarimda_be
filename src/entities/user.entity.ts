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

@Entity('users')
@Index(['fullName'])
@Index(['role'])
@Index(['isPermanentlyBanned', 'bannedUntil'])
export class User {
  @PrimaryColumn('varchar', { length: 64 })
  id: string;

  get _id(): string {
    return this.id;
  }

  @Column({ type: 'varchar', length: 255 })
  fullName: string;

  @Column({ type: 'varchar', length: 500, nullable: true, default: null })
  avatar: string | null;

  @Column({ type: 'text', default: '' })
  bio: string;

  @Column({ type: 'text', array: true, default: '{}' })
  followers: string[];

  @Column({ type: 'text', array: true, default: '{}' })
  following: string[];

  @Column({ type: 'text', array: true, default: '{}' })
  blockedUsers: string[];

  @Column({ type: 'text', array: true, default: '{}' })
  savedPosts: string[];

  @Column({ type: 'boolean', default: false })
  isVerified: boolean;

  @Column({ type: 'boolean', default: false })
  hideFollowers: boolean;

  @Column({ type: 'boolean', default: false })
  hideFollowing: boolean;

  @Column({ type: 'text', array: true, default: '{}' })
  hiddenFollowers: string[];

  @Column({ type: 'text', array: true, default: '{}' })
  hiddenFollowing: string[];

  @Column({ type: 'varchar', length: 50, default: 'user' })
  role: string;

  @Column({ type: 'int', default: 0 })
  warningCount: number;

  @Column({ type: 'timestamp with time zone', nullable: true, default: null })
  bannedUntil: Date | null;

  @Column({ type: 'boolean', default: false })
  isPermanentlyBanned: boolean;

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
    if (!this.followers) this.followers = [];
    if (!this.following) this.following = [];
    if (!this.blockedUsers) this.blockedUsers = [];
    if (!this.savedPosts) this.savedPosts = [];
    if (!this.hiddenFollowers) this.hiddenFollowers = [];
    if (!this.hiddenFollowing) this.hiddenFollowing = [];
  }

  toObject() {
    return {
      ...this,
      _id: this.id,
      followers: this.followers || [],
      following: this.following || [],
      blockedUsers: this.blockedUsers || [],
      savedPosts: this.savedPosts || [],
      hiddenFollowers: this.hiddenFollowers || [],
      hiddenFollowing: this.hiddenFollowing || [],
    };
  }
}
