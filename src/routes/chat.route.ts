import express from 'express'
import { ChatController } from '../controllers/chat.controller'
import { authenticate } from '../middleware/auth.middleware';

const chatController = new ChatController()
const chatRouter = express.Router()

chatRouter.get('/me', authenticate, chatController.getMyChats);
chatRouter.post('/ticket/:ticketId', authenticate, chatController.createTicketChat);
chatRouter.get('/files/:messageId', authenticate, chatController.getChatFile)
chatRouter.post('/files/:messageId', authenticate, chatController.newMessageFile)
chatRouter.get('/:chatId', authenticate, chatController.getChat)
chatRouter.get('/:chatId/messages', authenticate, chatController.getChatMessages)
chatRouter.post('/:chatId/messages', authenticate, chatController.sendMessage)

export default chatRouter