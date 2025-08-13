import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, JoinColumn, UpdateDateColumn } from 'typeorm'
import { Client } from './client.entity';

export interface IAccount {
  email: string;
  password: string;
  firstname: string;
  lastname: string;
  clientId: string;
  phone?: string;
  avatarUrl?: string;
}

@Entity('client_accounts')
export class ClientAccount{
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  firstname: string;
  
  @Column()
  lastname: string;

  @Column()
  email: string;

  @Column()
  password: string;

  @Column({nullable:true})
  avatarUrl?: string;
  
  @Column({nullable:true})
  phone?: string;

  @UpdateDateColumn()
  updatedAt: Date;
  
  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Client, (client) => client.files, { 
    onDelete: 'CASCADE' // Optional but recommended
  })
  @JoinColumn({ name: 'client_id' }) // Explicit column name
  client: Client;
}
