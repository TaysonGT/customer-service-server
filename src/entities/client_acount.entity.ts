import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, JoinColumn, UpdateDateColumn } from 'typeorm'
import { User } from './user.entity';

export interface IAccount {
  email: string;
  password: string;
  firstname: string;
  lastname: string;
  userId: string;
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

  @ManyToOne(() => User, (user) => user.accounts, { 
    onDelete: 'CASCADE' // Optional but recommended
  })
  @JoinColumn({ name: 'userId' }) // Explicit column name
  user: User;
}
