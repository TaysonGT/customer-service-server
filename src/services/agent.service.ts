import { PhoneNumberUtil } from "google-libphonenumber";
import { myDataSource } from "../app.data-source.js";
import { ServiceCategory } from "../entities/service-category.entity";
import { ISupportAgent, SupportAgent } from "../entities/support-agent.entity";
import supabase from "./supabase.service";
import {v4 as uuidV4} from 'uuid'

const agentRepo = myDataSource.getRepository(SupportAgent)
const phoneUtil = PhoneNumberUtil.getInstance()

export class AgentService{

    constructor(
    ){}

    async newAgent(data: ISupportAgent) {
        if (data.password !== data.confirmPassword) {
            throw new Error("Password confirmation doesn't match");
        }
        
        const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
        if (!emailRegex.test(data.email)) {
            throw new Error('Invalid email format');
        }

        // Phone validation
        const number = phoneUtil.parse(data.phone, data.countryCode || 'EG');
        if (!phoneUtil.isValidNumberForRegion(number, data.countryCode || 'EG')) {
            throw new Error('Invalid phone number for selected country');
        }
        const fullNumber = `+${number.getCountryCode()}${number.getNationalNumber()}`;

        if (!data.username) {
            throw new Error("No Username provided");
        }
        const trimmedUsername = data.username.toLowerCase().trim()
        const trimmedPassword = data.password.trim()

        // Transaction for data consistency
        return agentRepo.manager.transaction(async (transactionalEntityManager) => {
            // Get related category
            const category = await transactionalEntityManager.findOne(ServiceCategory, {
                where: { id: data.categoryId }
            });

            if (!category) throw new Error('Category not found');
            const userId = uuidV4();

            const { data: authData, error } = await supabase.auth.admin.createUser({
                email: data.email,
                password: trimmedPassword,
                email_confirm: true,
                user_metadata: {
                    id: userId,
                    firstname: data.firstname,
                    lastname: data.lastname,
                    role: 'support_agent',
                    avatarUrl: data.avatarUrl
                }
            });
            
            if (error) {
                console.error('Supabase auth error:', error);
                throw new Error('Authentication service error');
            }

            // Create agent instance
            const agent = agentRepo.create({
                id: userId,
                sb_uid: authData.user.id,
                firstname: authData.user.user_metadata.firstname,
                lastname: authData.user.user_metadata.lastname,
                username: trimmedUsername,
                email: authData.user.email,
                birthdate: new Date(data.birthdate),
                address: data.address,
                description: data.description,
                serviceCategory: category, // Use the actual entity
                avatarUrl: data.avatarUrl,
                phone: fullNumber
            });

            // Explicit save operation
            return await transactionalEntityManager.save(agent);
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

        const user = await agentRepo.findOne({where: {username: trimmedUsername}})
        
        if(!user) throw new Error('User not found')

        const { data: authData, error } = await supabase.auth.signInWithPassword({
            email: user.email,
            password: trimmedPassword
        });

        if (error) {
            throw new Error("Invalid email or password");
        }

        const safeUser = {
            id: user.id,
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            role: 'support_agent',
            avatarUrl: user.avatarUrl
        }

        return {safeUser, authData, expires}
    }

    
    async getAgentByUsername(username:string){
        if(!username) throw new Error('No username provided');
            
        const user = await agentRepo.findOne({where:{username:username.toLowerCase().trim()}})

        if(!user) throw new Error('User not found');
        return user
    }
}