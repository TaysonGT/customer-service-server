import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, ManyToOne } from 'typeorm';
import { ChatMessage } from './message.entity';
import { Client } from './client.entity';
import { Ticket } from './ticket.entity';

export interface IFile {
  path: string;
  bucket: string;
  name: string;
  type: 'audio'|'image'|'document';
  size: number;
  meta: { duration?: number; width?: number; height?: number };
  client_id?: string;
  message_id?: string;
}

@Entity('files_metadata')
export class FileMetadata {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', unique: true })
  path: string;

  @Column({ type: 'text' })
  bucket: string;

  @Column({ type: 'text' })
  name: string;
  
  @Column({ type: 'text' })
  type: 'audio' | 'image' | 'document';
  
  @Column({ type: 'bigint' })
  size: number;
  
  @Column({nullable:true})
  message_id?: string;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  uploaded_at: Date;
  
  @Column({ type: 'jsonb', nullable: true })
  meta: {
    duration?: number; // for audio
    width?: number;    // for images
    height?: number;   // for images
  };

  @OneToOne(() => ChatMessage, (message) => message.file, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({name: 'message_id'})
  message?: ChatMessage;

  @ManyToOne(() => Client, (client) => client.files, { 
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'client_id' })
  client?: Client;

  @ManyToOne(() => Ticket, (ticket) => ticket.attachments, { 
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'ticket_id' })
  ticket?: Ticket;
}
