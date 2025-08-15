import { Client, IClient } from "../entities/client.entity";
import { myDataSource } from "../app.data-source";
import { ServiceCategory } from "../entities/service-category.entity";
import { SupportAgent } from "../entities/support-agent.entity";
import { PhoneNumberUtil } from 'google-libphonenumber';
import { isUUID } from "class-validator";
import supabase from "./supabase.service";
import {v4 as uuidV4} from 'uuid'

const clientRepo = myDataSource.getRepository(Client)
// const categoryRepo = myDataSource.getRepository(ServiceCategory)
const agentRepo = myDataSource.getRepository(SupportAgent)
const phoneUtil = PhoneNumberUtil.getInstance()

export class ClientService{

    constructor(
        
    ){}

    async newClient(data: IClient): Promise<Client> {
        // Validation
        if (!data.username || !data.password) {
            throw new Error('Username and password are required');
        }
        if (!/^[a-zA-Z0-9_]+$/.test(data.username.toLowerCase())) {
            throw new Error('Invalid characters in username');
        }
        if (data.password !== data.confirmPassword) {
            throw new Error("Password confirmation doesn't match");
        }

        const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
        // Email validation
        if (!emailRegex.test(data.email)) {
            throw new Error('Invalid email format');
        }

        const emailExists =
            (await clientRepo.findOne({ where: { email:data.email } })) ||
            (await agentRepo.findOne({ where: { email:data.email } }));

        if (emailExists) throw new Error("Email already in use");
        
        // Phone validation
        const number = phoneUtil.parse(data.phone, data.countryCode || 'EG');
        if (!phoneUtil.isValidNumberForRegion(number, data.countryCode || 'EG')) {
            throw new Error('Invalid phone number for selected country');
        }
        const fullNumber = `+${number.getCountryCode()}${number.getNationalNumber()}`;

        // Transaction for data consistency
        return clientRepo.manager.transaction(async (transactionalEntityManager) => {
            // Get related entities
            const [category, agent] = await Promise.all([
            transactionalEntityManager.findOne(ServiceCategory, {
                where: { id: data.categoryId }
            }),
            transactionalEntityManager.findOne(SupportAgent, {
                where: { id: data.supportId }
            })
            ]);

            if (!category) throw new Error('Category not found');
            if (!agent) throw new Error('Agent not found');

            const userId = uuidV4()

            // Create client
            const { data: authData, error } = await supabase.auth.admin.createUser({
                email: data.email,
                password: data.password,
                email_confirm: true,
                user_metadata: {
                    id: userId,
                    firstname: data.firstname,
                    lastname: data.lastname,
                    role: 'client',
                    avatarUrl: data.avatarUrl
                }
            });

            if (error) {
                console.error('Supabase auth error:', error);
                throw new Error(error.message);
            }

            // Create client
            const client = transactionalEntityManager.create(Client, {
                id: userId,
                sb_uid: authData.user.id,
                firstname: authData.user.user_metadata.firstname,
                lastname: authData.user.user_metadata.lastname,
                email: authData.user.email,
                username: data.username.toLowerCase(),
                gender: data.gender,
                description: data.description,
                serviceCategory: { id: data.categoryId }, // Reference by ID
                supportAgent: { id: data.supportId }, // Reference by ID
                avatarUrl: data.avatarUrl,
                phone: fullNumber
            });

            return await transactionalEntityManager.save(client);
        });
    }
    

    async login(data: {username: string, password: string, remember: boolean}){
        let expires = 2 * 60 * 60 * 1000

        if(data.remember) expires = 8 * 1000 * 60 * 60;

        if(!data.password || !data.username){
            throw new Error('Please fill all the fields')
        }
        if (!/^[a-zA-Z0-9_]+$/.test(data.username.toLowerCase())) {
            throw new Error('Invalid characters in username');
        }

        const trimmedUsername = data.username.trim().toLowerCase();
        const trimmedPassword = data.password.trim();

        const user = await clientRepo.findOne({where: {username: trimmedUsername}})
        
        if(!user) throw new Error('User not found')
            
        const { data: authData, error } = await supabase.auth.signInWithPassword({
            email: user.email,
            password: trimmedPassword
        });

        if (error) {
            throw new Error(error.message || 'Authentication failed');
        }

        const safeUser = {
            id: user.id,
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            role: 'client',
            avatarUrl: user.avatarUrl
        }

        return {safeUser, authData, expires}
    }

    async allClients(){
        return await clientRepo.find()
    }
    
    async getClientById(id:string){
        const isValid = isUUID(id)
        
        if(!isValid) throw new Error('Invalid user_id')
            
        return await clientRepo.findOne({where:{id}})
    }

    async getClientByUsername(username:string){
        if(!username) throw new Error('No username provided');
            
        const user = await clientRepo.findOne({where:{username:username.toLowerCase().trim()}})

        if(!user) throw new Error('User not found');
        return user
    }
}