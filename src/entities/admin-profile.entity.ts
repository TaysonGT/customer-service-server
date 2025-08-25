// src/modules/admin/admin.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { AdminLog } from './admin-log.entity';

export enum AdminRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  SUPPORT = 'support',
  CONTENT_MANAGER = 'content_manager',
}

export enum AdminStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  PENDING = 'pending',
}

export interface IAdminProfile{
  role: AdminRole;
  status?: AdminStatus;
  title: string;
  permissions: { [key: string]: boolean }; // JSON string of specific permissions
  canManageAdmins?: boolean;
  createdById?: string;
}

@Entity('admin_profiles')
export class AdminProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column({
    type: 'enum',
    enum: AdminRole,
    default: AdminRole.MODERATOR,
  })
  role: AdminRole;

  @Column({
    type: 'enum',
    enum: AdminStatus,
    default: AdminStatus.PENDING,
  })
  status?: AdminStatus;

  @Column({ type: 'varchar', length: 100, nullable: true })
  title: string;

  @Column({ type: 'jsonb', nullable: true })
  permissions?: { [key: string]: boolean }; // JSON string of specific permissions

  @Column({ type: 'jsonb', nullable: true })
  workingHours?: { from: string, to: string };
  
  @Column({ type: 'jsonb', nullable: true })
  workingDays?: { from: number, to: number };

  @Column({ type: 'boolean', default: false })
  canManageAdmins: boolean;

  @Column({ type: 'boolean', default: false })
  canBanUsers: boolean;

  @Column({ type: 'boolean', default: false })
  canManageContent: boolean;

  @Column({ type: 'boolean', default: false })
  canManageSettings: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @ManyToOne(() => AdminProfile, { nullable: true })
  @JoinColumn({ name: 'createdById' })
  createdBy: AdminProfile;

  @OneToMany(() => AdminLog, log => log.admin)
  logs: AdminLog[];

  // Helper methods
  hasPermission(permission: string): boolean {
    if (this.role === AdminRole.SUPER_ADMIN) return true;
    return this.permissions?.[permission] || false;
  }

  isActive(): boolean {
    return this.status === AdminStatus.ACTIVE && !this.deletedAt;
  }
}