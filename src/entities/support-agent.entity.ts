import {Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToOne, ManyToMany, CreateDateColumn, UpdateDateColumn} from 'typeorm'
import { Client } from './client.entity';
import { ServiceCategory } from './service-category.entity';
import { Chat } from './chat.entity';
import { Ticket } from './ticket.entity';

export interface ISupportAgent {
  firstname: string;
  lastname: string;
  birthdate: Date;
  description: string;
  phone: string;
  address: string;
  gender: string;
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  categoryId: string;
  avatarUrl?: string;
  countryCode?: string;
}

@Entity('support_agents')
export class SupportAgent{
  @PrimaryGeneratedColumn('uuid')
  id: string;
  
  @Column({type: 'uuid', nullable: true})
  sb_uid?: string;

  @Column({unique:true})
  username: string;
  
  @Column()
  firstname: string;
  
  @Column()
  lastname: string;
  
  @Column({type: 'date'})
  birthdate?: Date;

  @Column()
  description: string;

  @Column()
  phone: string;

  @Column({unique: true})
  email: string;

  @Column()
  address: string;

  @Column({nullable: true})
  avatarUrl?: string;

  @UpdateDateColumn()
  last_seen_at: Date;  

  @UpdateDateColumn()
  updatedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(()=>ServiceCategory, (category)=> category.supportAgents)
  serviceCategory: ServiceCategory;

  @OneToMany(()=>Client, (client)=>client.supportAgent)
  clients: Client[];

  @OneToMany(()=>Ticket, (ticket)=>ticket.assignee)
  assignedTickets: Ticket[];

  @ManyToMany(()=>Chat, (chat)=>chat.supportAgents)
  chats: Chat[];

}
