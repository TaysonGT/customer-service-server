import {Entity, Column, PrimaryGeneratedColumn, OneToMany} from 'typeorm'
import { Client } from './client.entity';
import { SupportAgent } from './support-agent.entity';

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

  @OneToMany(()=>Client, (client)=>client.serviceCategory)
  clients: Client[];

  @OneToMany(()=>SupportAgent, (agent)=>agent.serviceCategory)
  supportAgents: SupportAgent[];

}
