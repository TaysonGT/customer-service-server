import { Request, Response } from "express"
import { myDataSource } from "../app.data-source.js"
import { IServiceCategory, ServiceCategory } from "../entities/service-category.entity"

const categoryRepo = myDataSource.getRepository(ServiceCategory)

export class AdminController{
    
    async createServiceCategory(req: Request, res: Response){
        const data = req.body

        const dataForm: IServiceCategory = {
            title: data.title,
            description: data.description,
        }

        const serviceCategory = categoryRepo.create(dataForm)

        await categoryRepo.save(serviceCategory).then(()=>{
            res.json({success:true, serviceCategory})
        }).catch((error)=>{
            res.json({message: 'Database operation failed', error, success: false})
        })
        
    }
}