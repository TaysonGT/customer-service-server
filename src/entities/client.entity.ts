import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { ServiceCategory } from './service-category.entity';
import { SupportAgent } from './support-agent.entity';
import { Chat } from './chat.entity';
import { FileMetadata } from './file_metadata.entity';
import { Ticket } from './ticket.entity';

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
    company?: string;
  jobTitle?: string;
  clientType?: 'individual' | 'business';
  status?: 'prospect' | 'active' | 'inactive' | 'vip';
  leadSource?: string;
  
  // Address
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  // Social
  socialProfiles?: {
    twitter?: string;
    linkedin?: string;
    facebook?: string;
    instagram?: string;
  };  
  // Preferences
  preferences?: {
    timezone?: string;
    language?: string;
    contactMethod?: 'email' | 'phone' | 'sms' | 'whatsapp';
    notificationPreferences?: {
      marketing?: boolean;
      productUpdates?: boolean;
    };
  };
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
    
    // Extended Info
    @Column({nullable: true})
    company?: string;
    @Column({nullable: true})
    jobTitle?: string;
    @Column({
      nullable: true,
      type: 'enum',
      enum: ['individual', 'business'],
    })
    clientType?: 'individual' | 'business';
    @Column({
      nullable: true,
      type: 'enum',
      enum: ['prospect', 'active', 'inactive', 'vip'],
    })
    status?: 'prospect' | 'active' | 'inactive' | 'vip';
    @Column({nullable: true})
    leadSource?: string;
    
    // Address
    @Column({type: 'jsonb', nullable: true})
    address?: {
      street?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    };
    
    // Social
    @Column({type: 'jsonb', nullable: true})
    socialProfiles?: {
      twitter?: string;
      linkedin?: string;
      facebook?: string;
      instagram?: string;
    };
    
    // Preferences
    @Column({type: 'jsonb', nullable: true})
    preferences?: {
      timezone?: string;
      language?: string;
      contactMethod?: 'email' | 'phone' | 'sms' | 'whatsapp';
      notificationPreferences?: {
        marketing?: boolean;
        productUpdates?: boolean;
      };
    };
    
    @ManyToOne(()=>ServiceCategory, (category)=> category.clients)
    serviceCategory: ServiceCategory;
    
    @ManyToOne(()=>SupportAgent, (agent)=> agent.clients)
    supportAgent: SupportAgent;

    @OneToMany(()=>Chat, (chat)=>chat.client)
    chats: Chat[];

    @OneToMany(()=>Ticket, (ticket)=>ticket.requester)
    submittedTickets: Ticket[];
 
    @OneToMany(()=>FileMetadata, (file)=>file.client)
    files: FileMetadata[];
}
