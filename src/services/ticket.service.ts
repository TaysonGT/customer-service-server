import { myDataSource } from "../app.data-source";
import { isUUID } from "class-validator";
import { FileMetadata, IFile } from "../entities/file_metadata.entity";
import { User } from "../entities/user.entity";
import { ITicket, Ticket, TicketStatus } from "../entities/ticket.entity";
import { Chat, IChat } from "../entities/chat.entity";
import { SessionUser } from "../middleware/auth.middleware";
import { AdminRole } from "../entities/admin-profile.entity";

const fileRepo = myDataSource.getRepository(FileMetadata)
const ticketRepo = myDataSource.getRepository(Ticket)
const userRepo = myDataSource.getRepository(User)

export class TicketService{

    constructor(
    ){}

    isWithinWorkingHours(user: User): boolean{
        if (!user.adminProfile?.workingHours) return true; // No restrictions
        
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes(); // Convert to minutes
        
        // Convert working hours to minutes
        const [fromHours, fromMinutes] = user.adminProfile.workingHours.from.split(':').map(Number);
        const [toHours, toMinutes] = user.adminProfile.workingHours.to.split(':').map(Number);
        
        const startMinutes = fromHours * 60 + fromMinutes;
        const endMinutes = toHours * 60 + toMinutes;
        
        // Check if current time is within working hours with 15-minute buffer
        return currentTime >= startMinutes && currentTime <= (endMinutes - 15);
    };

    async createTicket(data: any, userId: string) {
        if (!userId) throw new Error('No id provided');
        if(!isUUID(userId)) throw new Error(`Invalid Ticket Id: \"${userId}\"`);

        return ticketRepo.manager.transaction(async (transactionalEntityManager) => {
            const user = await transactionalEntityManager.findOne(User, {
                where: { id: userId },
                relations: { clientProfile: true }
            });

            if (!user) throw new Error('User not found');
            if (!user.clientProfile) throw new Error('User is not a client');

            const ticketData:ITicket = {
                subject: data.subject,
                description: data.description,
                category: data.category,
                status: data.status,
                priority: data.priority,
            }
            // Create file instance
            const ticket = transactionalEntityManager.create(Ticket, {...ticketData, requester: user});

            // Explicit save operation
            await transactionalEntityManager.save(ticket);
            
            data.attachments?.map((a:IFile)=>{
                const file = transactionalEntityManager.create(FileMetadata, {
                    name: a.name,
                    path: a.path,
                    bucket: 'ticket_files',
                    size: a.size,
                    type: a.type,
                    user
                });
                ticket.attachments.push(file)
            })

            return await transactionalEntityManager.save(ticket)
        });
    }

    async attachFilesToTicket(data: any, ticketId: number, userId: string) {
        if (!ticketId) throw new Error('No id provided')

        return ticketRepo.manager.transaction(async (transactionalEntityManager) => {
            const ticket = await transactionalEntityManager.findOne(Ticket, {
                where: { id: ticketId },
                relations: { attachments: true, assignee: true, requester: true }
            });
            if (!ticket) throw new Error('Ticket not found');

            const user = await transactionalEntityManager.findOne(User, {
                where: { id: userId },
                relations: { clientProfile: true, adminProfile: true }
            });

            if (!user) throw new Error('User not found');

            const isAssignee = user.id === ticket.assignee?.id
            const isRequester = user.id === ticket.requester?.id
            
            if (!isAssignee&&!isRequester) throw new Error('User has no access');
            
            const file = transactionalEntityManager.create(FileMetadata, {
                name: data.attachment.name,
                path: data.attachment.path,
                bucket: data.attachment.bucket,
                size: data.attachment.size,
                type: data.attachment.type,
                user
            });
            ticket.attachments.push(file)

            return await transactionalEntityManager.save(ticket)
        });
    }

    async startTicketChat(data: IChat, ticketId:number) {
        return ticketRepo.manager.transaction(async (transactionalEntityManager) => {
            // Get related category
            const ticket = await ticketRepo
            .createQueryBuilder('tickets')
            .innerJoinAndSelect('tickets.requester', 'requester')
            .leftJoinAndSelect('tickets.assignee', 'assignee')
            .leftJoinAndSelect('requester.chats', 'chats')
            .innerJoinAndSelect('requester.clientProfile', 'profile')
            .where('tickets.id = :ticketId', { ticketId })
            .getOne()

            if (!ticket) throw new Error('Ticket not found');
            if (!ticket.assignee) throw new Error('Ticket should be assigned before starting a chat');

            // Create file instance
            const chat = transactionalEntityManager.create(Chat, {
                title: ticket.subject,
                description: `Chat for ticket: ${ticket.id}`,
                ticket: {id: ticket.id},
                users: [{id: ticket.requester.id}, {id: ticket.assignee.id}]
            });

            ticket.requester.chats?
                ticket.requester.chats.push(chat)
                :ticket.requester.chats = [chat]
            
            ticket.assignee.chats?
                ticket.assignee.chats.push(chat)
                :ticket.assignee.chats = [chat]
            
            // Explicit save operation
            await transactionalEntityManager.save(chat)
            return await transactionalEntityManager.save(ticket);
        });
    }

    async getTicketAttachments(ticketId:number, user: SessionUser){
        if(!ticketId) throw new Error('No id provided');
        
        const ticket = await ticketRepo.findOne({where:{id: ticketId}, relations: {requester:true}})
        
        if(!ticket) throw new Error('Ticket not found')
        const isRequester = ticket.requester?.id === user.id
        const isAdmin = Object.values(AdminRole).includes(user.role as AdminRole)

        if(!isRequester&&!isAdmin) throw new Error('User has no access')
        
        const files = await fileRepo
            .createQueryBuilder("file")
            .innerJoin("file.ticket", "ticket", 'ticket.id = :ticketId', {ticketId}) // Join but don't select
            .getMany()

        return files
    }

    async getTicketsByUser(userId: string){
        if(!userId) throw new Error('No id provided');
        if(!isUUID(userId)) throw new Error(`Invalid User Id: \"${userId}\"`);

        const tickets = await ticketRepo
            .createQueryBuilder("tickets")
            .leftJoinAndSelect('tickets.requester', 'requester')
            .leftJoinAndSelect('tickets.chat', 'chat')
            .leftJoinAndSelect('chat.users', 'users')
            .leftJoinAndSelect('chat.messages', 'messages', "messages.status != :status", {status: 'seen'})
            .orderBy('messages.createdAt', 'DESC')
            .where('tickets.requester.id = :userId', {userId})
            .getMany()

        return tickets
    }

    async getTicketsByAssignee(userId: string){
        if(!userId) throw new Error('No id provided');
        if(!isUUID(userId)) throw new Error(`Invalid User Id: \"${userId}\"`);
        
        const tickets = await ticketRepo
            .createQueryBuilder("tickets")
            .innerJoinAndSelect('tickets.assignee', 'assignee')
            .leftJoinAndSelect('tickets.chat', 'chat')
            .leftJoinAndSelect('chat.users', 'users')
            .leftJoinAndSelect('chat.messages', 'messages', "messages.status != :status", {status: 'seen'})
            .orderBy('messages.createdAt', 'DESC')
            .where('assignee.id = :userId', {userId})
            .andWhere('tickets.status != :status1::tickets_status_enum OR tickets.status != :status2::tickets_status_enum', {status1: TicketStatus.CLOSED, status2: TicketStatus.RESOLVED})
            .getMany()
            

        return tickets
    }

    async ticketQueue(userId: string){
        if(!userId) throw new Error('No id provided');
        if(!isUUID(userId)) throw new Error(`Invalid UserId Id: \"${userId}\"`);

        const user = await userRepo
        .createQueryBuilder('users')
        .innerJoinAndSelect('users.adminProfile', 'adminProfile')
        .leftJoinAndSelect('users.assignedTickets', 'assignedTickets', 'assignedTickets.status != :status', {status: TicketStatus.CLOSED})
        .where('users.id = :userId', {userId})
        .getOne()
    
        if (!(user&&user.adminProfile)) return;
        if (user.assignedTickets.length>0) return;
        if (user.adminProfile.workingHours &&
            !this.isWithinWorkingHours(user)
        ) return;
        
        const ticket = await ticketRepo
            .createQueryBuilder('tickets')
            .innerJoinAndSelect('tickets.requester', 'requester')
            .leftJoinAndSelect('tickets.assignee', 'assignee')
            .where('tickets.status = :status', {status:TicketStatus.OPEN})
            .orderBy('tickets.createdAt', 'ASC')
            .getOne();

        if(!ticket) return;
        ticket.assignee = user
        ticket.status = TicketStatus.IN_PROGRESS;

        user.assignedTickets.push(ticket);

        await ticketRepo.save(ticket)
        await userRepo.save(user)

        return ticket
    }

    async closeTicket(ticketId:number, user: SessionUser) {
        return ticketRepo.manager.transaction(async (transactionalEntityManager) => {
            // Get related category
            const ticket = await ticketRepo
            .createQueryBuilder('tickets')
            .leftJoinAndSelect('tickets.assignee', 'user')
            .leftJoinAndSelect('tickets.chat', 'chat')
            .where('tickets.id = :ticketId', { ticketId })
            .getOne()

            if (!ticket) throw new Error('Ticket not found');

            const admin = await userRepo
            .createQueryBuilder('users')
            .innerJoinAndSelect('users.adminProfile', 'profile')
            .where('users.id = :userId', { userId: user.id })
            .getOne()

            if (!admin) throw new Error('User not found');
            if (ticket.assignee?.id !== admin.id && admin.adminProfile.role !== AdminRole.SUPER_ADMIN ) throw new Error('Unauthorized Action');
            
            if(ticket.chat) ticket.chat.status = 'ended';
            ticket.status = TicketStatus.RESOLVED
            
            // Explicit save operation
            return await transactionalEntityManager.save(ticket);
        });
    }


}


