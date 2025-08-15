import { myDataSource } from "../app.data-source";
import { ChatMessage, IChatMessage } from "../entities/message.entity";
import { Client } from "../entities/client.entity";
import { SupportAgent } from "../entities/support-agent.entity";
import { Chat } from "../entities/chat.entity";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import supabase from "./supabase.service";

const clientRepo = myDataSource.getRepository(Client)
const agentRepo = myDataSource.getRepository(SupportAgent)
const chatRepo = myDataSource.getRepository(Chat)
const messageRepo = myDataSource.getRepository(ChatMessage)


export class ChatService{
    constructor(){}

    async validateSender(userId: string, role: string): Promise<boolean> {
        const exists = role === 'client'
        ? await clientRepo.existsBy({ id: userId })
        : await agentRepo.existsBy({ id: userId });
        return exists
    }
    
    async validateChat(chatId: string): Promise<boolean> {
        const exists = await chatRepo.existsBy({ id: chatId });
        return exists
    }

    async createMessage(req:AuthenticatedRequest) {
        const data = req.body        
        const userId = req.user!.id; // From auth middleware
        
        if (!await this.validateChat(data.chatId)) {
            throw new Error('Chat not Found'); // Custom exceptions work better
        }
        
        // Validate chat access (similar to your hasChatAccess function)
        if (!await this.validateSender(userId, data.chatId)) {
            throw new Error('No chat access')
        }

        return await messageRepo.save({
            content: data.content,
            chat_id: data.chatId,
            sender_id: userId,
            sender_type: req.user?.role // 'client' or 'support_agent'
        });

    }

    async sendMessage(data: IChatMessage) {
        const message = messageRepo.create({ content:data.content, senderType: data.senderType, senderId: data.senderId, chatId: data.chatId});
        await messageRepo.save(message); // TypeORM handles the write
    }

    subscribeToMessages(roomId: string, callback: (message: ChatMessage) => void) {
        return supabase
            .channel('messages')
            .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `room_id=eq.${roomId}`
            },
            (payload) => callback(payload.new as ChatMessage)
            )
            .subscribe();
    }

    async getClientChats(userId: string){
        const chats = await chatRepo.find({
            where: { client: { id: userId } },
            relations: {
                client: true,
                supportAgents: true,
                messages: true
            }, // Include related entities
            order: { messages: {createdAt: 'ASC'} } // Newest chats first
        });

        const chatsWithParticipants = chats.map((chat)=>({
            ...chat,
            lastMessage: chat.messages? chat.messages[chat.messages.length-1] : null,
            unread_messages: chat.messages?.filter(m => m.status !== 'seen').length ?? 0,
            participants:[
                ...chat.supportAgents.map(a => ({
                    id: a.id,
                    username: a.username,
                    firstname: a.firstname,
                    lastname: a.lastname,
                    avatarUrl: a.avatarUrl,
                    role: 'support_agent' as const,
                    email: a.email
                })),
                ...(chat.client?[{ 
                    id: chat.client.id,
                    username: chat.client.username,
                    firstname: chat.client.firstname,
                    lastname: chat.client.lastname,
                    avatarUrl: chat.client.avatarUrl,
                    role: 'client' as const,
                    email: chat.client.email
                }]:[])
            ]
        }))

        const soleChats = chatsWithParticipants.map((chat) => {
            const { ['messages']: prop1, ...rest } = chat;
            return rest;
        });

        return soleChats;
    }

    async getAgentChats(userId: string){
        const chats = await chatRepo.find({
            where: { supportAgents: { id: userId } },
            relations: {
                supportAgents: true,
                client: true,
                messages: true,
            }, // Include related entities
            order: { messages: {createdAt: 'ASC'} } // Newest chats first
        });

        
        const chatsWithParticipants = chats.map((chat)=>({
            ...chat,
            lastMessage: chat.messages? chat.messages[chat.messages.length-1] : null,
            unread_messages: chat.messages?.filter(m => m.status !== 'seen').length ?? 0,
            participants:[
                ...chat.supportAgents.map(a => ({
                    id: a.id,
                    username: a.username,
                    firstname: a.firstname,
                    lastname: a.lastname,
                    avatarUrl: a.avatarUrl,
                    role: 'support_agent' as const,
                    email: a.email
                })),
                ...(chat.client?[{ 
                    id: chat.client.id,
                    username: chat.client.username,
                    firstname: chat.client.firstname,
                    lastname: chat.client.lastname,
                    avatarUrl: chat.client.avatarUrl,
                    role: 'client' as const,
                    email: chat.client.email
                }]:[])
            ]
        }))

        const soleChats = chatsWithParticipants.map((chat) => {
            const { ['messages']: prop1, ...rest } = chat;
            return rest;
        });

        return soleChats;
    }

    async getMessages(chatId: string, limit?: number, cursor?: string) {
        const query = messageRepo
        .createQueryBuilder('message')
        .leftJoinAndSelect('message.file', 'file') // Simplified join condition
        .leftJoinAndMapOne(
            'message.sender',
            Client,
            'client',
            'message.senderId = client.id AND message.senderType = :clientType',
            { clientType: 'client' }
        )
        .leftJoinAndMapOne(
            'message.sender',
            SupportAgent,
            'agent',
            'message.senderId = agent.id AND message.senderType = :agentType',
            { agentType: 'support_agent' }
        )
        .where('message.chatId = :chatId', { chatId })
        .orderBy('message.createdAt', 'DESC');
        if (cursor) {
            query.andWhere('message.createdAt < :cursor', {
            cursor: new Date(cursor),
            });
        }

        const realLimit = limit || 20;
        query.take(realLimit + 1);

        const messages = await query.getMany();
        const hasMore = messages.length > realLimit;
        const trimmedMessages = hasMore ? messages.slice(0, realLimit) : messages;

        const nextCursor = hasMore
            ? trimmedMessages[trimmedMessages.length - 1]?.createdAt.toISOString()
            : undefined;

        return {
            data: trimmedMessages.reverse(),
            nextCursor,
        };
    }

}