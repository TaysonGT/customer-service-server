// src/modules/admin/admin-log.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { AdminProfile } from './admin-profile.entity';

export enum AdminAction {
  LOGIN = 'login',
  LOGOUT = 'logout',
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  BAN = 'ban',
  UNBAN = 'unban',
  SETTINGS_CHANGE = 'settings_change',
}

@Entity('admin_logs')
export class AdminLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  admin_id: string;
  
  // ✅ Direct link to AdminProfile
  @ManyToOne(() => AdminProfile)
  @JoinColumn({ name: 'admin_id' })
  admin: AdminProfile;

  @Column()
  adminProfileId: string;

  @Column({ type: 'enum', enum: AdminAction })
  action: AdminAction; // e.g., 'USER_BAN', 'SETTINGS_UPDATE'

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>; // Additional context

  @CreateDateColumn()
  timestamp: Date;

  @Column({ type: 'text', nullable: true })
  details: string;

  @Column({ type: 'varchar', length: 39, nullable: true })
  ipAddress: string;

  @CreateDateColumn()
  createdAt: Date;
}