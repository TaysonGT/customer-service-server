import { Response, Request } from "express";
import { myDataSource } from "../app.data-source";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { Ticket } from "../entities/ticket.entity";
import { TicketService } from "../services/ticket.service";
import { AdminRole } from "../entities/admin-profile.entity";

const ticketRepo = myDataSource.getRepository(Ticket)
const ticketService = new TicketService()

export class TicketController {
    
    async getAllTickets(req: Request, res: Response){
        const tickets = await ticketRepo.find({relations:{requester: true}})

        res.json({success:true, tickets})
    }

    async getMyTickets(req: AuthenticatedRequest, res: Response){
        ticketService.getTicketsByUser(req.user.id)
        .then((tickets)=> res.json({success:true, tickets}))
        .catch(error=>res.json({success:false, message: error.message}))
    }

    async getAssigneeTickets(req: AuthenticatedRequest, res: Response){
        if(req.user.role === 'client'){
            res.status(403).json({success:false, message: 'Unauthorized'})
            return
        }
        ticketService.getTicketsByAssignee(req.user.id)
        .then((tickets)=> res.json({success:true, tickets}))
        .catch(error=>res.json({success:false, message: error.message}))
    }

    async getTicketAttachments(req: AuthenticatedRequest, res: Response){
        const {ticketId} = req.params
        const user = req.user
        
        ticketService.getTicketAttachments(parseInt(ticketId), user)
        .then(attachments=>res.json({success:true, attachments}))
        .catch(error=> res.json({success:false, message: error.message}))
    }

    async getTicket(req: AuthenticatedRequest, res: Response){
        const {ticketId} = req.params
        const user = req.user
    
        const query = ticketRepo
        .createQueryBuilder('tickets')
        .leftJoinAndSelect('tickets.requester', 'requester')
        .leftJoinAndSelect('tickets.assignee', 'assignee')
        if(Object.values(AdminRole).includes(req.user.role as AdminRole)){
            query.leftJoinAndSelect('tickets.ccRecipients', 'ccRecipients')
        }
        
        const ticket = await query.leftJoinAndSelect('tickets.chat', 'chat')
        .leftJoinAndSelect('chat.users', 'users')
        .where('tickets.id = :ticketId', {ticketId: parseInt(ticketId)})
        .getOne()
        
        if(!ticket) {
            res.status(404).json({success: false, message: 'Ticket not Found'})
            return
        }

        // Enhanced access control check
        const isMember = user.id === ticket.requester?.id || ticket.chat?.users.some(member => member.id === user?.id);
        const hasAdminRole = Object.values(AdminRole).includes(user.role as AdminRole);

        if (!isMember && !hasAdminRole) {
            res.status(403).json({ success: false, message: 'Access denied' });
            return 
        }

        res.json({success:true, ticket})
    }

    async createTicket(req: AuthenticatedRequest, res: Response){
        await ticketService.createTicket(req.body, req.user.id)
        .then((ticket)=>{
            res.json({ success: true, ticket });
        }).catch(error=>{
            res.json({success:false, message: error.message})
        })
    }

    async closeTicket(req: AuthenticatedRequest, res: Response){
        await ticketService.closeTicket(parseInt(req.params.ticketId), req.user)
        .then((ticket)=>{
            res.json({ success: true, ticket, message: 'Ticket closed successfully' });
        }).catch(error=>{
            res.json({success:false, message: error.message})
        })
    }

    async attachFilesToTicket(req: AuthenticatedRequest, res: Response){
        await ticketService.attachFilesToTicket(req.body, parseInt(req.params.ticketId), req.user.id)
        .then((ticket)=>{
            res.json({ success: true, ticket });
        }).catch(error=>{
            res.json({success:false, message: error.message})
        })
    }

    async createTicketWithoutAuth(req: AuthenticatedRequest, res: Response){
        await ticketService.createTicket(req.body, req.body.userId)
        .then((ticket)=>{
            res.json({ success: true, ticket });
        }).catch(error=>{
            res.json({success:false, message: error.message})
        })
    }

    async createTicketChat(req: AuthenticatedRequest, res: Response){
        await ticketService.startTicketChat(req.body, parseInt(req.params.ticketId))
        .then((chat)=>{
            res.status(201).json({success: true, message: 'Created new chat successfully',chat})
        }).catch(error=> {
            res.status(401).json({success: false, message: error.message || 'Error occurred while creating new chat'})
        })
    }

    async assignTicketToAgent(req: AuthenticatedRequest, res: Response){
        await ticketService.startTicketChat(req.body, parseInt(req.params.ticketId))
        .then((chat)=>{
            res.status(201).json({success: true, message: 'Created new chat successfully',chat})
        }).catch(error=> {
            res.status(401).json({success: false, message: error.message || 'Error occurred while creating new chat'})
        })
    }

}