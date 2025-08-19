import { Response, Request } from "express";
import { myDataSource } from "../app.data-source";
import { Chat } from "../entities/chat.entity";
import { ChatService } from "../services/chat.service";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { FileService } from "../services/file.service";
import { User, UserRole } from "../entities/user.entity";
import { Ticket } from "../entities/ticket.entity";

const chatRepo = myDataSource.getRepository(Chat)
const ticketRepo = myDataSource.getRepository(Ticket)
const userRepo = myDataSource.getRepository(User)

const chatService = new ChatService()
const fileService = new FileService()

interface messageParams{
    cursor?: string;
    limit?: string;   
    initial?: string;     
}

export class ChatController {
    
    async getAllChats(req: Request, res: Response){
        const chats = await chatRepo.find()

        res.json({success:true, chats})
    }

    async getChat(req: AuthenticatedRequest, res: Response){
        const chatId = req.params.chatId
        const user = req.user
    
        const chat = await chatRepo.findOne({where:{id:chatId}, relations:{
            users: true
        }})
        
        if(!chat) {
            res.status(404).json({success: false, message: 'Chat not Found'})
            return
        }

        // Enhanced access control check
        const isMember = chat.users.some(member => member.id === user?.id);
        const isAdmin = user?.role === 'admin';

        if (!isMember && !isAdmin) {
            res.status(403).json({ success: false, message: 'Access denied' });
            return 
        }

        res.json({success:true, chat})
    }

    async sendMessage(req: AuthenticatedRequest, res: Response){
        await chatService.createMessage(req)
        .then((message)=>{
            res.json({ success: true, message });
        }).catch(error=>{
            res.json({success:false, message: error.message})
        })
    }

    async newMessageFile(req: AuthenticatedRequest, res: Response){
        await fileService.createMessageWithFile(req.body)
        .then((file)=>{
            res.json({ success: true, file });
        }).catch(error=>{
            res.json({success:false, message: error.message})
        })
    }

    async getChatFile(req: AuthenticatedRequest, res: Response){
        await fileService.getChatFile(req.params.messageId)
        .then((file)=>{
            res.json({ success: true, file });
        }).catch(error=>{
            res.json({success:false, message: error.message})
        })
    }

    async getChatMessages(req: Request, res: Response){
        const { chatId } = req.params
        const { cursor, limit, initial }:messageParams = req.query

        let parsedLimit = limit? parseInt(limit): undefined
        
        let participants: {
            id: string;
            username: string;
            firstname: string;
            lastname: string;
            avatarUrl?: string;
            role: UserRole;
            email: string;
        }[] = []

        if(initial === 'true'){
            const users = await userRepo
            .find({where:{chats:{id:chatId}}, relations:{chats: true, clientProfile: true, adminProfile: true}})

            participants = [
            ...users.map(a => ({
                id: a.id,
                username: a.username,
                firstname: a.firstname,
                lastname: a.lastname,
                avatarUrl: a.avatarUrl,
                role: a.clientProfile ? 'client' as UserRole : a.adminProfile ? a.adminProfile.role : 'support' as UserRole,
                email: a.email
            }))
        ];
        }

        chatService.getMessages(chatId, parsedLimit, cursor)
        .then(({data, nextCursor})=>{
            res.json({success:true, messages: data, nextCursor, participants})
        }).catch(error=>
            res.status(400).json({message: error.message, success:false})
        )

    }
    
    async allSupportAgents(req: Request, res: Response){
        const { chatId } = req.params
        const supportAgents = userRepo
        .createQueryBuilder('agents')
        .innerJoin('agents.adminProfile', 'admin') // Filter only
        .innerJoin('agents.chats', 'chat', 'chat.id = :chatId', { chatId })
        .where('admin.role = :role', { role: 'support' })
        .getMany()

        res.json({success:true, supportAgents});
    }

    async createTicketChat(req: AuthenticatedRequest, res: Response){
        try {
            const ticketId = req.params.ticketId;
            const {title, description, clientId} = req.body;

            const ticket = await ticketRepo
            .createQueryBuilder('tickets')
            .innerJoin('tickets.requester', 'requester', 'requester.id = :clientId', { clientId })
            .where('tickets.id = :ticketId', { ticketId })
            .getOne()
            
            if (!ticket) {
                res.status(400).json({ success:false, error: 'Ticket not found!' });
                return 
            }

            const client = await userRepo
            .createQueryBuilder('clients')
            .innerJoin('clients.clientProfile', 'client') // Filter only
            .where('clients.id = :clientId', { clientId })
            .getOne()

            if (!client) {
                res.status(400).json({ success:false, error: 'Client not found!' });
                return 
            }

            if (!client.clientProfile) {
                res.status(400).json({ success:false, error: 'User is not a client!' });
                return 
            }

            const newChat = chatRepo.create({
                title,
                description,
                ticket,
            })

            chatRepo.save(newChat)
            .then((chat)=>{
                res.status(201).json({success: true, message: 'Created new chat successfully',chat})
                
            }).catch(error=> {
                res.status(401).json({success: false, message: 'Error occurred while creating new chat'})
            })

        }catch(error){
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    
    
    async getMyChats(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.user?.id;
            
            if (!userId) {
                res.status(403).json({ success:false, error: 'Unauthorized' });
                return 
            }

            const chats = await chatService.getUserChats(userId)
            res.json({success:true, chats});
            
        } catch (error) {
            console.error('Error fetching chats:', error);
            res.status(500).json({ success:false, error: 'Internal server error' });
        }
    };
}