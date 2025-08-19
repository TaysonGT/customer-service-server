// src/modules/user/user.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToOne, OneToMany, ManyToMany, JoinTable, ManyToOne, JoinColumn } from 'typeorm';
import { FileMetadata } from './file_metadata.entity';
import { Ticket } from './ticket.entity';
import { Chat } from './chat.entity';
import { ClientProfile } from './client-profile.entity';
import { AdminProfile, AdminRole } from './admin-profile.entity';
import { ServiceCategory } from './service-category.entity';
import { ClientAccount } from './client_acount.entity';

// 2. Define client role
export const CLIENT_ROLE = 'client' as const;

// 3. Create combined type
export type UserRole = typeof AdminRole[keyof typeof AdminRole] | typeof CLIENT_ROLE;

export interface IUser {
  sb_uid?: string;
  username: string;
  firstname: string;
  lastname: string;
  email: string;
  serviceCategory?: ServiceCategory,
  avatarUrl?: string;
  phone?: string;
  countryCode?: string;
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { nullable: true })
  sb_uid?: string;

  // Authentication fields
  @Column({ unique: true })
  username: string;

  @Column({ unique: true })
  email: string;

  // Core profile fields
  @Column()
  firstname: string;

  @Column()
  lastname: string;

  @Column({ nullable: true })
  avatarUrl?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  countryCode?: string;

  // System fields
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastSeenAt: Date;

  // Relationships
  @OneToOne(() => ClientProfile, profile => profile.user, { nullable: true })
  @JoinColumn({ name: 'clientProfileId' })
  clientProfile: ClientProfile;
  
  @OneToOne(() => AdminProfile, profile => profile.user, { nullable: true })
  @JoinColumn({ name: 'adminProfileId' })
  adminProfile: AdminProfile;

  @OneToMany(() => User, client => client.createdBy)
  createdUsers: User[];

  @ManyToOne(() => User, user => user.createdUsers)
  @JoinColumn({ name: 'createdById' })
  createdBy?: User;

  @ManyToMany(() => Chat, chat => chat.users, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinTable({
    name: 'chat_users',
    joinColumn: {
      name: 'user_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'chat_id',
      referencedColumnName: 'id',
    },
  })
  chats: Chat[];

  @ManyToOne(() => ServiceCategory, category => category.agents, { nullable: true })
  @JoinColumn({ name: 'service_category_id' })
  serviceCategory?: ServiceCategory;

  @OneToMany(() => Ticket, ticket => ticket.requester)
  submittedTickets: Ticket[];

  @OneToMany(() => Ticket, ticket => ticket.assignee)
  assignedTickets: Ticket[];

  @OneToMany(() => FileMetadata, file => file.user)
  files: FileMetadata[];

  @OneToMany(() => ClientAccount, account => account.user)
  accounts: ClientAccount[];
}