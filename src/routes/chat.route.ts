import express from 'express'
import { ChatController } from '../controllers/chat.controller'
import { authenticate } from '../middleware/auth.middleware';

const chatController = new ChatController()
const chatRouter = express.Router()

chatRouter.get('/me', authenticate, chatController.getMyChats);
chatRouter.get('/me/unread', authenticate, chatController.getMyUnreadChats);
chatRouter.get('/files/:messageId', authenticate, chatController.getChatFile)
chatRouter.get('/:chatId', authenticate, chatController.getChat)
chatRouter.get('/:chatId/messages', authenticate, chatController.getChatMessages)
chatRouter.get('/:chatId/participants', authenticate, chatController.getChatParticipants)
chatRouter.get('/:chatId/files', authenticate, chatController.getChatFiles)
chatRouter.get('/messages/:messageId', authenticate, chatController.getSingleMessage)
chatRouter.post('/:chatId/messages', authenticate, chatController.sendMessage)
chatRouter.patch('/:chatId/messages/seen', authenticate, chatController.markMessagesAsSeen)

export default chatRouter