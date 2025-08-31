import { myDataSource } from "../app.data-source";
import { ChatMessage } from "../entities/message.entity";
import { Chat } from "../entities/chat.entity";
import { SessionUser } from "../middleware/auth.middleware";
import { User } from "../entities/user.entity";
import { isUUID } from "class-validator";
import { FileMetadata } from "../entities/file_metadata.entity";
import { AdminRole } from "../entities/admin-profile.entity";

const userRepo = myDataSource.getRepository(User)
const chatRepo = myDataSource.getRepository(Chat)
const fileRepo = myDataSource.getRepository(FileMetadata)
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

    async sendMessage(data: any, user: SessionUser) {
        const chat = await chatRepo.createQueryBuilder('chats')
        .innerJoin('chats.users', 'users', 'users.id = :userId', {userId: user.id})
        .where('chats.id = :chatId', {chatId: data.chatId})
        .getOne()

        if(!chat) throw new Error('User is not a member of this chat')
        
        const message = messageRepo.create({
            id: data.id,
            content: data.content, 
            senderId: data.senderId,
            chat,
            type: data.type,
            status: data.status
        });

        if(data.file){
            const file = fileRepo.create({
                path: data.file.path,
                bucket: data.file.bucket,
                name: data.file.name,
                size: data.file.size,
                type: data.file.type,
                meta: data.file.meta,
                user: {id: user.id}
            })
            await fileRepo.save(file)
            message.file = file;
        }
        
        return await messageRepo.save(message)
    }

    async getUserChats(userId: string){
        const isValid = isUUID(userId)

        if(!isValid) throw new Error('Invalid user_id')

        const chats = await chatRepo
        .createQueryBuilder('chats')
        .innerJoin('chats.users', 'currentUser', 'currentUser.id = :userId', { userId })
        .leftJoinAndSelect('chats.messages', 'messages')
        .leftJoinAndSelect('messages.sender', 'sender')
        .leftJoinAndSelect('chats.users', 'users')
        .leftJoinAndSelect('users.clientProfile', 'clientProfile')
        .leftJoinAndSelect('users.adminProfile', 'adminProfile')
        .orderBy('messages.createdAt', 'ASC')
        .getMany()

        const chatsWithParticipants = chats.map((chat)=>({
            ...chat,
            lastMessage: chat.messages? chat.messages[chat.messages.length-1] : null,
            unread_messages: chat.messages?.filter(m => m.sender.id !== userId && m.status !== 'seen'),
        }))

        const soleChats = chatsWithParticipants.map((chat) => {
            const { ['messages']: prop1, ...rest } = chat;
            return rest;
        });

        return soleChats;
    }

    async getChatUsers(chatId: string, user: SessionUser){
        const isValid = isUUID(chatId)

        if(!isValid) throw new Error('Invalid chat_id')

        const users = await userRepo
        .createQueryBuilder('users')
        .innerJoin('users.chats', 'chats', 'chats.id = :chatId', { chatId })
        .leftJoinAndSelect('users.clientProfile', 'clientProfile')
        .leftJoinAndSelect('users.adminProfile', 'adminProfile')
        .getMany()

        if(!users.some(u=>user.id===u.id)&&!Object.values(AdminRole).includes(user.role as AdminRole)) throw new Error("You're not a member of this chat")

        return users;
    }

    async getMessages(chatId: string, limit?: number, cursor?: string) {
        const query = messageRepo
        .createQueryBuilder('message')
        .leftJoinAndSelect('message.file', 'file')
        .leftJoinAndSelect('message.sender','user')
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
            ? trimmedMessages[trimmedMessages.length - 1]?.createdAt
            : undefined;

        return {
            data: trimmedMessages.reverse(),
            nextCursor,
        };
    }

    async getMessage(messageId: string, cursor?:string) {
        const message = await messageRepo
        .createQueryBuilder('message')
        .leftJoinAndSelect('message.file', 'file')
        .leftJoinAndSelect('message.sender','user')
        .leftJoinAndSelect('user.clientProfile', 'clientProfile')
        .leftJoinAndSelect('user.adminProfile', 'adminProfile')
        .where('message.id = :messageId', { messageId })
        .getOne()
        
        if(message&&cursor){
            console.log(new Date(cursor))
            console.log(new Date(message.createdAt))
            console.log(new Date(message.createdAt) < new Date(cursor))
        }
        return message
    }

    async markMessagesAsSeen(chatId: string, user: SessionUser, cursor?: string) {
        const query = messageRepo
        .createQueryBuilder('message')
        .innerJoin('message.sender','sender', 'sender.id != :userId', {userId: user.id})
        .where('message.chatId = :chatId', { chatId })
        .andWhere('message.status != :status', { status: 'seen' })
        
        if (cursor) {
            query.andWhere('message.createdAt > :cursor', {
                cursor: new Date(cursor),
            });
        }

        const messageIds = await query.getRawMany().then(results => 
            results.map(result => result.message_id)
        );

        if (messageIds.length === 0) {
            return null;
        }
        
        const result = await messageRepo
            .createQueryBuilder()
            .update()
            .set({ status: 'seen' })
            .where('id IN (:...messageIds)', { messageIds })
            .execute();

        return result.affected;
    }
}