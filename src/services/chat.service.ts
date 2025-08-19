import { myDataSource } from "../app.data-source";
import { ChatMessage, IChatMessage } from "../entities/message.entity";
import { Chat } from "../entities/chat.entity";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import supabase from "./supabase.service";
import { User } from "../entities/user.entity";
import { isUUID } from "class-validator";

const userRepo = myDataSource.getRepository(User)
const chatRepo = myDataSource.getRepository(Chat)
const messageRepo = myDataSource.getRepository(ChatMessage)


export class ChatService{
    constructor(){}

    async validateSender(userId: string, role: string): Promise<boolean> {
        const exists = await userRepo.existsBy({ id: userId })
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

    async getUserChats(userId: string){
        const isValid = isUUID(userId)

        if(!isValid) throw new Error('Invalid user_id')

        const chats = await chatRepo
        .createQueryBuilder('chats')
        .leftJoinAndSelect('chats.messages', 'message')
        .leftJoinAndSelect('chats.users', 'users')
        .leftJoinAndSelect('users.clientProfile', 'clientProfile')
        .where('users.id = :userId', { userId })
        .orderBy('message.createdAt', 'ASC')
        .getMany()

        const chatsWithParticipants = chats.map((chat)=>({
            ...chat,
            lastMessage: chat.messages? chat.messages[chat.messages.length-1] : null,
            unread_messages: chat.messages?.filter(m => m.senderId !== userId && m.status !== 'seen'),
            participants:[
                ...chat.users.map(user => ({
                    id: user.id,
                    username: user.username,
                    firstname: user.firstname,
                    lastname: user.lastname,
                    avatarUrl: user.avatarUrl,
                    role: user.adminProfile? user.adminProfile.role : 'client',
                    email: user.email
                }))
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
        .leftJoinAndSelect('message.file', 'file')
        .leftJoinAndMapOne('message.sender', User, 'user')
        .leftJoinAndSelect('user.clientProfile', 'clientProfile')
        .leftJoinAndSelect('user.adminProfile', 'adminProfile')
        .where('message.chatId = :chatId', { chatId })
        .orderBy('message.createdAt', 'DESC')
        
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