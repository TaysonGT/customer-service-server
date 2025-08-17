import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  ManyToOne, 
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable
} from 'typeorm';
import { Client } from './client.entity';
import { SupportAgent } from './support-agent.entity';
import { FileMetadata } from './file_metadata.entity';

export enum TicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  ON_HOLD = 'on_hold',
  RESOLVED = 'resolved',
  CLOSED = 'closed'
}

export enum TicketPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

@Entity()
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  subject: string;

  @Column('text')
  description: string;

  @ManyToOne(() => Client, (client) => client.submittedTickets)
  @JoinColumn({ name: 'requester_id' })
  requester: Client;

  @ManyToOne(() => SupportAgent, (agent) => agent.assignedTickets, { nullable: true })
  @JoinColumn({ name: 'assignee_id' })
  assignee: SupportAgent | null;

  @Column({
    type: 'enum',
    enum: TicketStatus,
    default: TicketStatus.OPEN
  })
  status: TicketStatus;

  @Column({
    type: 'enum',
    enum: TicketPriority,
    default: TicketPriority.MEDIUM
  })
  priority: TicketPriority;

  @Column({ nullable: true })
  category: string;

  @OneToMany(() => FileMetadata, (file) => file.ticket)
  attachments: FileMetadata[];

  @ManyToMany(() => SupportAgent)
  @JoinTable({ name: 'ticket_cc_agents' })
  ccRecipients: SupportAgent[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  resolvedAt: Date | null;

  @Column({ default: false })
  isUrgent: boolean;
}