import express from 'express'
import { AgentController } from '../controllers/agent.controller'

const agentController = new AgentController()
const agentRouter = express.Router()

agentRouter.get('/', agentController.getAllAgents)
agentRouter.post('/', agentController.createSupportAgent)
agentRouter.get('/:id', agentController.getAgent)
agentRouter.get('/category/:categoryId', agentController.getCategoryAgents)

export default agentRouter