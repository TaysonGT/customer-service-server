import { Response, Request } from "express";
import { myDataSource } from "../app.data-source";
import { IServiceCategory, ServiceCategory } from "../entities/service-category.entity";

const categoryRepo = myDataSource.getRepository(ServiceCategory)


export class CategoryController {
    
    async getAllCategories(req: Request, res: Response){
        try{
            const categories = await categoryRepo.find()
    
            res.json({success:true, categories})
        }catch(error){
            res.json({success:false, message: error.message})
        }
    }
 
    async createCategory(req: Request, res: Response){
        try{
            const data:IServiceCategory = req.body
            
            const category = categoryRepo.create({
                title: data.title,
                description: data.description
            })

            await categoryRepo.save(category)
            
            res.json({success:true, category})
        }catch(error){
            res.json({success:false, message: error.message})
        }
    }

}