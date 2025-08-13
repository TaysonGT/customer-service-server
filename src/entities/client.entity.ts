import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { ServiceCategory } from './service-category.entity';
import { SupportAgent } from './support-agent.entity';
import { Chat } from './chat.entity';
import { FileMetadata } from './file_metadata.entity';

export interface IClient {
  firstname: string;
  lastname: string;
  username: string;
  gender: string;
  email: string;
  description?: string;
  password: string;
  confirmPassword: string;
  categoryId: string;
  supportId: string;
  avatarUrl?: string;
  phone: string;
  countryCode?: string;
}

@Entity('clients')
export class Client{
    @PrimaryGeneratedColumn('uuid')
    id: string;
    
    @Column({type: 'uuid', nullable: true})
    sb_uid?: string;

    @Column({unique: true})
    username: string;

    @Column()
    firstname: string;
    
    @Column()
    lastname: string;
    
    @Column()
    gender: string;
    
    @Column({unique:true})
    email: string;
    
    @Column()
    description: string;
  
    @Column({nullable: true})
    avatarUrl?: string;
    
    @Column()
    phone: string;
    
    @UpdateDateColumn()
    last_seen_at: Date;
    
    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
    
    @ManyToOne(()=>ServiceCategory, (category)=> category.clients)
    serviceCategory: ServiceCategory;
    
    @ManyToOne(()=>SupportAgent, (agent)=> agent.clients)
    supportAgent: SupportAgent;

    @OneToMany(()=>Chat, (chat)=>chat.client)
    chats: Chat[];
 
    @OneToMany(()=>FileMetadata, (file)=>file.client)
    files: FileMetadata[];
}