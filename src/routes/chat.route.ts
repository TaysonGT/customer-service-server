import express from 'express'
import { ChatController } from '../controllers/chat.controller'
import { authenticate } from '../middleware/auth.middleware';

const chatController = new ChatController()
const chatRouter = express.Router()


chatRouter.post('/', chatController.createChat)
chatRouter.get('/me', authenticate, chatController.getMyChats);
chatRouter.get('/files/:messageId', authenticate, chatController.getChatFile)
chatRouter.post('/files/:messageId', authenticate, chatController.newMessageFile)
chatRouter.get('/:chatId', authenticate, chatController.getChat)
chatRouter.get('/:chatId/messages', authenticate, chatController.getChatMessages)
chatRouter.post('/client/:clientId', authenticate, chatController.createChat);
chatRouter.post('/:chatId/messages', authenticate, chatController.sendMessage)

export default chatRouter