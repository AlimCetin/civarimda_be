import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('item_comments')
@Index(['itemId', 'itemType'])
@Index(['createdAt'])
export class ItemComment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 64 })
  itemId: string;

  @Column({ type: 'varchar', length: 50 })
  itemType: 'place' | 'campaign';

  @Column({ type: 'varchar', length: 64 })
  userId: string;

  @Column({ type: 'text' })
  text: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;
}
