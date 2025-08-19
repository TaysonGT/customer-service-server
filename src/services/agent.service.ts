import { PhoneNumberUtil } from "google-libphonenumber";
import { myDataSource } from "../app.data-source";
import { ServiceCategory } from "../entities/service-category.entity";
import supabase from "./supabase.service";
import { IUser, User } from "../entities/user.entity";
import { AdminProfile } from "../entities/admin-profile.entity";

const userRepo = myDataSource.getRepository(User)
const phoneUtil = PhoneNumberUtil.getInstance()

export class AgentService{

    constructor(
    ){}

    async newAgent(data: any) {
        if (data.password && data.password !== data.confirmPassword) {
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

        if (!data.categoryId) {
            throw new Error("No Category Id provided");
        }
        const trimmedUsername = data.username.toLowerCase().trim()
        const trimmedPassword = data.password.trim()

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
            // Get related category
            const category = await transactionalEntityManager.findOne(ServiceCategory, {
                where: { id: data.categoryId }
            });
            
            if (!category) throw new Error('Category not found');

            const userData:IUser = {
                firstname: data.firstname,
                lastname: data.lastname,
                username: trimmedUsername,
                email: data.email,
                avatarUrl: data.avatarUrl,
                serviceCategory: category,
                phone: fullNumber
            }
            // Create agent instance
            const user = userRepo.create(userData);

            await transactionalEntityManager.save(user).catch(error=>{throw error})

            const { data: authData, error } = await supabase.auth.admin.createUser({
                email: data.email,
                password: trimmedPassword,
                email_confirm: true,
                user_metadata: {
                    id: user.id,
                    firstname: data.firstname,
                    lastname: data.lastname,
                    role: 'support',
                    avatarUrl: data.avatarUrl
                }
            });
            
            if (error) {
                console.error('Supabase auth error:', error);
                throw new Error('Authentication service error');
            }

            const adminProfile = transactionalEntityManager.create(AdminProfile, {
                // createdBy: currentUser,
                user,
                title: data.title,
                role: data.role,
                permissions: data.permissions,
            });

            user.sb_uid = authData.user.id;
            user.adminProfile = adminProfile;
            
            await transactionalEntityManager.save(adminProfile)
            await transactionalEntityManager.save(user)

            // Explicit save operation
            return {user, adminProfile};
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

        const user = await userRepo.findOne({where: {username: trimmedUsername}, relations:{adminProfile: true, clientProfile: true}})
        
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
            role: user.adminProfile? user.adminProfile.role: 'client',
            profile: user.adminProfile || user.clientProfile || null,
            avatarUrl: user.avatarUrl
        }

        return {safeUser, authData, expires}
    }
}