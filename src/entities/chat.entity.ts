import {Entity, Column, PrimaryGeneratedColumn, ManyToOne, ManyToMany, OneToMany, CreateDateColumn, UpdateDateColumn, JoinColumn, JoinTable} from 'typeorm'
import { Client } from './client.entity';
import { SupportAgent } from './support-agent.entity';
import { ChatMessage } from './message.entity';

export interface IChat {
  title: string;
  description: string;
  client_id: string;
}

@Entity('chats')
export class Chat{
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;
  
  @Column()
  description: string;

  @Column({default: false})
  ended: boolean;

  @Column({default: 'waiting'})
  status: 'waiting'|'active'|'ended';
  
  @Column({default: false})
  unread: boolean;

  @CreateDateColumn()
  startedAt: Date;
  
  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Client, (client) => client.chats, { 
    onDelete: 'CASCADE' // Optional but recommended
  })
  @JoinColumn({ name: 'client_id' }) // Explicit column name
  client: Client;

  @ManyToMany(() => SupportAgent, (agent) => agent.chats)
  @JoinTable({
    name: 'chat_agents', // Explicit join table name
    joinColumn: { name: 'chat_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'agent_id', referencedColumnName: 'id' }
  })
  supportAgents: SupportAgent[];

  @OneToMany(() => ChatMessage, (message) => message.chat, {
    cascade: true // Optional for automatic saves
  })
  messages: ChatMessage[];
}
