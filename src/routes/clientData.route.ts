import express from 'express'
import { ClientDataController } from "../controllers/clientData.controller";
import { authenticate } from '../middleware/auth.middleware';

const clientDataController = new ClientDataController()
const clientDataRouter = express.Router()

clientDataRouter.get('/all/:clientId', clientDataController.getClientData)
clientDataRouter.get('/docs/:clientId', clientDataController.getDocs)
clientDataRouter.get('/images/:clientId', clientDataController.getImages)
clientDataRouter.post('/images/client', authenticate, clientDataController.createFile)
clientDataRouter.get('/:id', clientDataController.getFile)

export default clientDataRouter