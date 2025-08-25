import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  UpdateDateColumn,
  Column,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { Chat } from './chat.entity';

@Entity('typing_status')
@Unique (['chat', 'user']) // Add this decorator
export class TypingStatus {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Chat)
  @JoinColumn({ name: 'chat_id' })
  chat: Chat;

  @Column({type: 'boolean'})
  is_typing: boolean

  @UpdateDateColumn()
  last_updated: Date;
}