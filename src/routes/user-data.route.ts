import express from 'express'
import { UserDataController } from "../controllers/user-data.controller";
import { authenticate } from '../middleware/auth.middleware';

const userDataController = new UserDataController()
const userDataRouter = express.Router()

userDataRouter.get('/all/:userId', userDataController.getUserData)
userDataRouter.get('/docs/:userId', userDataController.getDocs)
userDataRouter.get('/images/:userId', userDataController.getImages)
userDataRouter.post('/', authenticate, userDataController.createFile)
userDataRouter.get('/:id', userDataController.getFile)

export default userDataRouter