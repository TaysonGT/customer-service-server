import { Response, Request } from "express";
import supabase from "../services/supabase.service";
import { AuthService } from "../services/auth.service";
import { UserRole } from "../entities/user.entity";
import { AuthenticatedRequest } from "../middleware/auth.middleware";

const authService = new AuthService()

export class AuthController {


    async loginUser(req: Request, res: Response){
        const data:{username: string, password: string, remember: boolean} = req.body
        if(req.params.role!=='admin' && req.params.role!=='client') {
            res.json({success: false, message: 'Invalid role'})
            return 
        }

        authService.login(data, req.params.role as UserRole)
        .then(({safeUser, authData, expires})=>{
            res.cookie('sb_access_token', authData.session.access_token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: expires
            })
            res.cookie('sb_refresh_token', authData.session.refresh_token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
            })
            res.cookie('current_user', JSON.stringify(safeUser), {
                httpOnly: false,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: expires
            })
            res.json({
                message: "Login Successful",
                success: true,
                user: safeUser
            })
        }).catch((error)=>{
            res.json({message: error.message, success: false});
        })
    }

    async refreshToken(req: Request, res: Response) {
        const refreshToken = req.cookies.sb_refresh_token;
        const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });

        if (!data || !data.session) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        if (error) {
            console.error('Supabase auth error:', error);
            res.status(500).json({ error: 'Authentication service error' });
            return;
        }
        res.cookie("sb_access_token", data.session.access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 1000 // 1 hour
        });
        res.cookie("sb_refresh_token", data.session.refresh_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
        });
        res.json({ success: true, user: data.user });
    }

    async resolveUsername(req: Request, res: Response) {
        try{
            const data = req.body;
            const user = await authService.getUserByUsername(data.username);
            res.status(200).json({ success:true, email: user.email });            
        }catch (error) {
            res.status(404).json({ success:false, error: error.message || 'Username not found' });
        }
    }

    async getUserById(req: Request, res: Response) {
        try{
            const {id} = req.params;
            const user = await authService.getUserById(id);
            res.status(200).json({ success:true, user });            
        }catch (error) {
            res.status(404).json({ success:false, error: error.message || 'User not found' });
        }
    }

    async getMyProfile(req: AuthenticatedRequest, res: Response) {
        try{
            const user = await authService.getMyUser(req.user);
            res.status(200).json({ success:true, user });            
        }catch (error) {
            res.status(404).json({ success:false, error: error.message || 'User not found' });
        }
    }
}