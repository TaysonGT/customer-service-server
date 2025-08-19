import express from 'express'
import { AuthController } from '../controllers/auth.controller'
import { authenticate } from '../middleware/auth.middleware'

const authController = new AuthController()
const authRouter = express.Router()

authRouter.post('/login/:role', authController.loginUser)
authRouter.post('/refresh', authController.refreshToken)
authRouter.post('/username-resolve', authController.resolveUsername)
authRouter.get('/user/me', authenticate, authController.getMyProfile)
authRouter.get('/user/:id', authController.getUserById)

export default authRouter