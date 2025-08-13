import express from 'express'
import { CategoryController } from '../controllers/category.controller'

const categoryController = new CategoryController()
const categoryRouter = express.Router()

categoryRouter.get('/', categoryController.getAllCategories)
