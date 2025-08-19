import {Entity, Column, PrimaryGeneratedColumn, OneToMany} from 'typeorm'
import { User } from './user.entity';

export interface IServiceCategory {
  title: string;
  description: string;
}

@Entity('service_categories')
export class ServiceCategory{
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;
  
  @Column()
  description: string;

  @OneToMany(()=>User, (agent)=>agent.serviceCategory)
  agents: User[];

}
