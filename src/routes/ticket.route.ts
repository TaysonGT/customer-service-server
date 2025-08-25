import express from 'express'
import { TicketController } from '../controllers/ticket.controller'
import { authenticate } from '../middleware/auth.middleware';

const ticketController = new TicketController()
const ticketRouter = express.Router()

// For API Testing
ticketRouter.post('/test', ticketController.createTicketWithoutAuth)
ticketRouter.get('/', ticketController.getAllTickets);

ticketRouter.post('/', authenticate, ticketController.createTicket)
ticketRouter.get('/client', authenticate, ticketController.getMyTickets);
ticketRouter.get('/support', authenticate, ticketController.getAssigneeTickets);
ticketRouter.get('/:ticketId', authenticate, ticketController.getTicket)
ticketRouter.get('/:ticketId/attachments', authenticate, ticketController.getTicketAttachments)
ticketRouter.post('/:ticketId/attachments', authenticate, ticketController.attachFilesToTicket)
ticketRouter.post('/:ticketId/chat', authenticate, ticketController.createTicketChat)
ticketRouter.put('/:ticketId/close', authenticate, ticketController.closeTicket)

export default ticketRouter