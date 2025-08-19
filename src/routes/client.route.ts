import { ClientController } from "../controllers/client.controller";
import express from 'express'

const clientController = new ClientController()
const clientRouter = express.Router()

clientRouter.get('/', clientController.allClients)
clientRouter.get('/allUsers', clientController.allUsers)
clientRouter.get('/:id', clientController.getClient)
clientRouter.post('/', clientController.createClient)

export default clientRouter