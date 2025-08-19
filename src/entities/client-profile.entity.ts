// src/modules/user/client-profile.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, OneToOne, ManyToOne } from 'typeorm';
import { User } from './user.entity';

@Entity('client_profiles')
export class ClientProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User)
  user: User;

  // Business-specific fields
  @Column({ nullable: true })
  company?: string;

  @Column({ nullable: true })
  jobTitle?: string;

  @Column({ type: 'enum', enum: ['individual', 'business'], nullable: true })
  clientType?: 'individual' | 'business';

  @Column({ type: 'enum', enum: ['prospect', 'active', 'inactive', 'vip'], nullable: true })
  status?: 'prospect' | 'active' | 'inactive' | 'vip';

  @Column({ nullable: true })
  leadSource?: string;

  // Address
  @Column({ type: 'jsonb', nullable: true })
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };

  // Social
  @Column({ type: 'jsonb', nullable: true })
  socialProfiles?: {
    twitter?: string;
    linkedin?: string;
    facebook?: string;
    instagram?: string;
  };

  // Preferences
  @Column({ type: 'jsonb', nullable: true })
  preferences?: {
    timezone?: string;
    language?: string;
    contactMethod?: 'email' | 'phone' | 'sms' | 'whatsapp';
    notificationPreferences?: {
      marketing?: boolean;
      productUpdates?: boolean;
    };
  };

  @ManyToOne(() => User, user => user.createdUsers)
  createdBy: User;
}