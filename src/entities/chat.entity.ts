import {Entity, Column, PrimaryGeneratedColumn, ManyToMany, OneToMany, CreateDateColumn, UpdateDateColumn, JoinTable, OneToOne, JoinColumn} from 'typeorm'
import { ChatMessage } from './message.entity';
import { User } from './user.entity';
import { Ticket } from './ticket.entity';

export interface IChat {
  title: string;
  description: string;
  ticketId: string;
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

  @OneToOne(()=>Ticket, (ticket) => ticket.chat, {onDelete: 'CASCADE', onUpdate: 'CASCADE'})
  @JoinColumn({name: 'ticket_id'})
  ticket: Ticket

  @CreateDateColumn()
  startedAt: Date;
  
  @UpdateDateColumn()
  updatedAt: Date;
  
  @ManyToMany(() => User, (user) => user.chats)
  @JoinTable({
    name: 'chat_users', // Explicit join table name
    joinColumn: {
      name: 'chat_id',
      referencedColumnName: 'id'
    },
    inverseJoinColumn: {
      name: 'user_id',
      referencedColumnName: 'id'
    }
  })
  users: User[];

  @OneToMany(() => ChatMessage, (message) => message.chat, {
    cascade: true // Optional for automatic saves
  })
  messages: ChatMessage[];
}
