import { Response, Request } from "express";
import { myDataSource } from "../app.data-source.js";
import { SupportAgent } from "../entities/support-agent.entity";
import { Chat, IChat } from "../entities/chat.entity";
import { ChatService } from "../services/chat.service";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { Client } from "../entities/client.entity";
import { FileService } from "../services/file.service.js";

const agentRepo = myDataSource.getRepository(SupportAgent)
const chatRepo = myDataSource.getRepository(Chat)
const clientRepo = myDataSource.getRepository(Client)

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
            supportAgents: true,
            client: true
        }})
        
        if(!chat) {
            res.status(404).json({success: false, message: 'Chat not Found'})
            return
        }
        // Enhanced access control check
        const isClient = user?.id === chat.client.id;
        const isAssignedAgent = chat.supportAgents.some(agent => agent.id === user?.id);
        const isAdmin = user?.role === 'admin';

        if (!isClient && !isAssignedAgent && !isAdmin) {
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
            res.json({success:false, error})
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
            role: 'client' | 'support_agent' | 'admin';
            email: string;
        }[] = []

        if(initial === 'true'){
            const client = await clientRepo.findOne({where:{chats:{id:chatId}}, relations:{chats: true}})
            
            const agents = await agentRepo
            .createQueryBuilder('support_agent')
            .leftJoin('support_agent.chats', 'chat', 'chat.id = :chatId', { chatId })
            .getMany();

            participants = [
            ...agents.map(a => ({
                id: a.id,
                username: a.username,
                firstname: a.firstname,
                lastname: a.lastname,
                avatarUrl: a.avatarUrl,
                role: 'support_agent' as const,
                email: a.email
            })),
            ...(client ? [{
                id: client.id,
                username: client.username,
                firstname: client.firstname,
                lastname: client.lastname,
                avatarUrl: client.avatarUrl,
                role: 'client' as const,
                email: client.email
            }] : [])
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
        const { chatId, userId } = req.params
        const agentsQuery = agentRepo
        .createQueryBuilder('agent')
        .innerJoin('agent.chats', 'chat', 'chat.id = :chatId', { chatId })
        .where('agent.id = :userId', { userId })

        const supportAgents = await agentsQuery.getMany()

        res.json({success:true, supportAgents});
    }

    async createChat(req: AuthenticatedRequest, res: Response){
        try {
            const clientId = req.params.clientId;
            const {title, description} = req.body;
            const client = await clientRepo.findOne({where:{id:clientId}, relations: {supportAgent: true}})

            if (!client) {
                res.status(403).json({ success:false, error: 'Client not found!' });
                return 
            }

            const chatData:IChat = {
                title,
                description,
                client_id: clientId
            }

            const newChat = chatRepo.create(chatData)

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
            
            // Verify the requesting user has access to these chats
            if (!userId) {
                res.status(403).json({ success:false, error: 'Unauthorized' });
                return 
            }

            if(req.user?.role === 'client'){
                const chats = await chatService.getClientChats(userId)
                res.json({success:true, chats})
            }else if(req.user?.role === 'support_agent'){
                const chats = await chatService.getAgentChats(userId)
                res.json({success:true, chats});
            }
        } catch (error) {
            console.error('Error fetching chats:', error);
            res.status(500).json({ success:false, error: 'Internal server error' });
        }
    };
}