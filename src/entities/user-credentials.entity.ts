import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  BeforeInsert,
  BeforeUpdate,
  AfterLoad,
} from 'typeorm';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcryptjs';

@Entity('user_credentials')
@Index(['userId'], { unique: true })
@Index(['email'], { unique: true })
export class UserCredentials {
  @PrimaryColumn('varchar', { length: 64 })
  id: string;

  get _id(): string {
    return this.id;
  }

  set _id(val: string) {
    if (val) this.id = val;
  }

  @Column({ type: 'varchar', length: 64, unique: true })
  userId: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255, select: false })
  password: string;

  @Column({ type: 'varchar', length: 500, nullable: true, default: null, select: false })
  refreshToken: string | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;

  @BeforeInsert()
  async generateIdAndHashPassword() {
    if (!this.id) {
      this.id = randomUUID();
    }
    if (this.password && !this.password.startsWith('$2a$') && !this.password.startsWith('$2b$')) {
      this.password = await bcrypt.hash(this.password, 12);
    }
  }

  @BeforeUpdate()
  async hashPasswordOnUpdate() {
    if (this.password && !this.password.startsWith('$2a$') && !this.password.startsWith('$2b$')) {
      this.password = await bcrypt.hash(this.password, 12);
    }
  }

  @AfterLoad()
  populateVirtuals() {
    (this as any)._id = this.id;
  }

  async comparePassword(candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
  }
}
