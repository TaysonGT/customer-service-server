import { Response, Request } from "express";
import { myDataSource } from "../app.data-source";
import { Chat } from "../entities/chat.entity";
import { ChatService } from "../services/chat.service";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { FileService } from "../services/file.service";
import { User } from "../entities/user.entity";

const chatRepo = myDataSource.getRepository(Chat)
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
        await chatService.sendMessage(req.body, req.user)
        .then((message)=>{
            res.json({ success: true, message });
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

    async getChatParticipants(req: AuthenticatedRequest, res: Response){
        await chatService.getChatUsers(req.params.chatId, req.user)
        .then((users)=>{
            res.json({ success: true, users });
        }).catch(error=>{
            res.json({success:false, message: error.message})
        })
    }

    async getChatMessages(req: Request, res: Response){
        const { chatId } = req.params
        const { cursor, limit }:messageParams = req.query

        let parsedLimit = limit? parseInt(limit): undefined

        chatService.getMessages(chatId, parsedLimit, cursor)
        .then(({messages, nextCursor, fileMessages})=>{
            res.json({success:true, messages, fileMessages, nextCursor})
        }).catch(error=>
            res.status(400).json({message: error.message, success:false})
        )

    }

    async markMessagesAsSeen(req: AuthenticatedRequest, res: Response){
        const { chatId } = req.params
        const { cursor }:messageParams = req.query

        chatService.markMessagesAsSeen(chatId, req.user, cursor)
        .then((result)=>{
            res.json({success:true, result})
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

    async getMyUnreadChats(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.user?.id;
            
            if (!userId) {
                res.status(403).json({ success:false, error: 'Unauthorized' });
                return 
            }

            const unreadChats = await chatService.getUserUnreadChats(userId)
            res.json({success:true, unreadChats});
            
        } catch (error) {
            console.error('Error fetching chats:', error);
            res.status(500).json({ success:false, error: 'Internal server error' });
        }
    };

    async getSingleMessage(req: AuthenticatedRequest, res: Response) {
        const {messageId} = req.params
        const {cursor}:messageParams = req.query

        chatService.getMessage(messageId, cursor)
        .then((message)=>{
            res.json({success:true, message})
        }).catch(error=>
            res.status(400).json({message: error.message, success:false})
        )   
    }
    
    async getChatFiles(req: AuthenticatedRequest, res: Response) {
        const {chatId} = req.params

        fileService.getChatFiles(chatId)
        .then((files)=>{
            res.json({success:true, files})
        }).catch(error=>
            res.status(400).json({message: error.message, success:false})
        )   
    }
    
}