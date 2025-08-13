import { Response, Request } from "express";
import { ClientService } from "../services/client.service";
import { AgentService } from "../services/agent.service";
import supabase from "../services/supabase.service";


const clientService = new ClientService()
const agentService = new AgentService()

export class AuthController {


    async loginClient(req: Request, res: Response){
        const data:{username: string, password: string, remember: boolean} = req.body

        clientService.login(data)
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

    
    async loginAgent(req: Request, res: Response){
        const data:{username: string, password: string, remember: boolean} = req.body

        agentService.login(data)
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
            if(req.params.role === 'client') {
                const user = await clientService.getClientByUsername(data.username);
                res.status(200).json({ success:true, email: user.email });
            } else if(req.params.role === 'support_agent') {
                const user = await agentService.getAgentByUsername(data.username);
                res.status(200).json({ success:true, email: user.email });
                return
            } else {
                res.status(400).json({ success:false, error: 'Invalid role' });
            }
        }catch (error) {
            res.status(404).json({ success:false, error: error.message || 'Username not found' });
        }
    }
}