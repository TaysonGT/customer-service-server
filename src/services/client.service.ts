import { myDataSource } from "../app.data-source";
import { ServiceCategory } from "../entities/service-category.entity";
import { PhoneNumberUtil } from 'google-libphonenumber';
import { isUUID } from "class-validator";
import supabase from "./supabase.service";
import { User } from "../entities/user.entity";
import { ClientProfile } from "../entities/client-profile.entity";

const userRepo = myDataSource.getRepository(User)
const phoneUtil = PhoneNumberUtil.getInstance()

export class ClientService{

    constructor(
        
    ){}

    async newClient(data: any) {
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

        const trimmedUsername = data.username.toLowerCase().trim()
        const trimmedPassword = data.password.trim()

        const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
        // Email validation
        if (!emailRegex.test(data.email)) {
            throw new Error('Invalid email format');
        }
        // Phone validation
        const number = phoneUtil.parse(data.phone, data.countryCode || 'EG');
        if (!phoneUtil.isValidNumberForRegion(number, data.countryCode || 'EG')) {
            throw new Error('Invalid phone number for selected country');
        }
        const fullNumber = `+${number.getCountryCode()}${number.getNationalNumber()}`;

        // Transaction for data consistency
        return userRepo.manager.transaction(async (transactionalEntityManager) => {
            const existingUser = await transactionalEntityManager.findOne(User, { 
                where: [
                    { username: trimmedUsername },
                    { email: data.email }
                ]
            });

            if (existingUser) {
                throw new Error('Username or email already exists');
            }
            
            // Get related entities
            const [category, agent] = await Promise.all([
                transactionalEntityManager.findOne(ServiceCategory, {
                    where: { id: data.categoryId }
                }),
                transactionalEntityManager.findOne(User, {
                    where: { id: data.agentId }
                })
            ]);

            if (!category) throw new Error('Category not found');
            if (!agent) throw new Error('Agent not found');
            
            const user = transactionalEntityManager.create(User, {
                firstname: data.firstname,
                lastname: data.lastname,
                username: trimmedUsername,
                email: data.email,
                gender: data.gender,
                description: data.description,
                createdBy: agent,
            })

            await transactionalEntityManager.save(user).catch(error=>{throw error})

            // Create client
            const { data: authData, error } = await supabase.auth.admin.createUser({
                email: data.email,
                password: trimmedPassword,
                email_confirm: true,
                user_metadata: {
                    id: user.id,
                    username: trimmedUsername,
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
            const clientProfile = transactionalEntityManager.create(ClientProfile, {
                user,
                avatarUrl: data.avatarUrl,
                phone: fullNumber,
                company: data.company,
                jobTitle: data.jobTitle,
                clientType: data.clientType,
                status: data.status,
                leadSource: data.leadSource,
                address: data.address,
                socialProfiles: data.socialProfiles
            });

            user.sb_uid = authData.user.id;
            user.clientProfile = clientProfile;

            await transactionalEntityManager.save(clientProfile), 
            await transactionalEntityManager.save(user)

            return {user, clientProfile}
        });
    }
    
    async allClients(){
        const clients = await userRepo
        .createQueryBuilder('user')
        .innerJoinAndSelect('user.clientProfile', 'clientProfile')
        .getMany()

        return clients
    }

    async allUsers(){
        const users = await userRepo.find({relations:{adminProfile: true, clientProfile: true}})

        return users
    }
    
    async getClientById(id:string){
        const isValid = isUUID(id)
        
        if(!isValid) throw new Error('Invalid user_id')

        const client = await userRepo
        .createQueryBuilder('user')
        .innerJoinAndSelect('user.clientProfile', 'clientProfile')
        .where('user.id = :userId', { userId: id })
        .getOne()
            
        return client
    }
}