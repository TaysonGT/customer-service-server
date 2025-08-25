import {Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index, CreateDateColumn, OneToOne} from 'typeorm'
import { Chat } from './chat.entity';
import {IsIn, IsString, IsUUID, MaxLength} from 'class-validator'
import { FileMetadata } from './file_metadata.entity';
import { User } from './user.entity';

export class IChatMessage {
  id:string;

  @IsString()
  @MaxLength(400)
  content: string;

  @IsIn(['audio', 'image', 'document', 'text'])
  type: 'audio'|'image'|'document'|'text';

  @IsUUID()
  chatId: string;
}

export interface IMessageGroup {
  senderId: string;
  messages: ChatMessage[];
  showHeader: boolean;
  timestamp: Date;
  senderInfo: {
    firstname: string;
    lastname: string;
    avatarUrl?: string;
  };
}

// Message Entity
@Entity('chat_messages')
@Index(['createdAt'])
export class ChatMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  content: string;

  @Column({default: 'text'})
  type?: 'audio'|'image'|'document'|'text';
  
  @Column({default: 'delivered'})
  status?: 'delivered'|'seen';

  @CreateDateColumn({ type: 'timestamptz', default: () => 'now()' })
  createdAt: Date;

  @OneToOne(() => FileMetadata, { nullable: true, onDelete: 'SET NULL', cascade: true })
  @JoinColumn({ name: 'file_id' })
  file?: FileMetadata;

  @ManyToOne(() => User)
  @JoinColumn([{ name: 'senderId' }])
  sender: User;

  @ManyToOne(()=>Chat, (chat)=>chat.messages)
  @JoinColumn({name: 'chatId'})
  chat: Chat;
}
