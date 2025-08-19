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

  @IsUUID()
  senderId: string;

  @IsIn(['audio', 'image', 'document', 'text'])
  type: 'audio'|'image'|'document'|'text';

  @IsIn(['client', 'support_agent'])
  senderType: 'client' | 'support_agent';

  @IsUUID()
  chatId: string;
}

export interface IMessageGroup {
  senderId: string;
  senderType: 'client' | 'support_agent';
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
@Index(['chatId', 'createdAt'])
export class ChatMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  content: string;

  @Index()  
  @Column()
  senderType: 'client' | 'support_agent'; // Explicit discriminator

  @Index()
  @Column()
  senderId: string; // Stores ID of either client or agent

  @Column({default: 'text'})
  type?: 'audio'|'image'|'document'|'text';
  
  @Column({default: 'delivered'})
  status?: 'delivered'|'seen';

  @CreateDateColumn({ type: 'timestamptz', default: () => 'now()' })
  createdAt: Date;

  @OneToOne(() => FileMetadata, { nullable: true, onDelete: 'SET NULL', cascade: true })
  @JoinColumn({ name: 'file_id' })
  file?: FileMetadata;

  // Virtual relations (TypeORM will hydrate these based on senderType)
  @ManyToOne(() => User, {
    nullable: true,
    createForeignKeyConstraints: false 
  })
  @JoinColumn([{ name: 'senderId', referencedColumnName: 'id' }])
  sender?: User;

  @ManyToOne(()=>Chat, (chat)=>chat.messages)
  @JoinColumn({name: 'chatId'})
  chat: Chat;

  @Column()
  chatId: string;
}
