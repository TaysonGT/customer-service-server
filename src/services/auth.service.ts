import supabase from "./supabase.service";
import { myDataSource } from "../app.data-source";
import { User, UserRole } from "../entities/user.entity";
import { isUUID } from "class-validator";
import { SessionUser } from "../middleware/auth.middleware";

const userRepo = myDataSource.getRepository(User)

export class AuthService{

    constructor(
    ){}

    async login(data: {username: string, password: string, remember: boolean}, role: UserRole){
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

    async getUserById(id: string){
        const isValid = isUUID(id)
        
        if(!isValid) throw new Error('Invalid user_id')

        const user = await userRepo
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.clientProfile', 'clientProfile')
        .leftJoinAndSelect('user.adminProfile', 'adminProfile')
        .where('user.id = :userId', { userId: id })
        .getOne()

        if(!user) throw new Error('User not found')

        const safeUser = {
            id: user.id,
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            role: user.adminProfile? user.adminProfile.role: 'client',
            profile: user.adminProfile || user.clientProfile || null,
            avatarUrl: user.avatarUrl
        }
            
        return safeUser
    }

    async getMyUser(reqUser: SessionUser){
        const user = await userRepo
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.clientProfile', 'clientProfile')
        .leftJoinAndSelect('user.adminProfile', 'adminProfile')
        .where('user.id = :userId', { userId: reqUser.id })
        .getOne()

        if(!user) throw new Error('User not found')

        const safeUser = {
            id: user.id,
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            role: user.adminProfile? user.adminProfile.role: 'client',
            profile: user.adminProfile || user.clientProfile || null,
            avatarUrl: user.avatarUrl
        }
            
        return safeUser
    }

    async getUserByUsername(username:string, role: "client"|"support"){
        if(!username) throw new Error('No username provided');
        if(!role||(role!=='client'&&role!=='support')) throw new Error('User role error')
        

        const user = await userRepo.createQueryBuilder('users')
        .where('users.username = :username', {username})
        .innerJoinAndSelect(
            role === 'client' ? 'users.clientProfile' : 'users.adminProfile',
            role === 'client' ? 'clientProfile' : 'adminProfile'
        )
        .getOne()

        if(!user) throw new Error('User not found');
        return user
    }
}