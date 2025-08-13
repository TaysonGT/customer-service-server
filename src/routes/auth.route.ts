import express from 'express'
import { AuthController } from '../controllers/auth.controller'

const authController = new AuthController()
const authRouter = express.Router()

authRouter.post('/login/client', authController.loginClient)
authRouter.post('/login/support', authController.loginAgent)
authRouter.post('/refresh', authController.refreshToken)
authRouter.post('/username-resolve/:role', authController.resolveUsername)

export default authRouter