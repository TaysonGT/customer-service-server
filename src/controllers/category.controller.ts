import { Response, Request } from "express";
import { myDataSource } from "../app.data-source";
import { ServiceCategory } from "../entities/service-category.entity";

const categoryRepo = myDataSource.getRepository(ServiceCategory)


export class CategoryController {
    
    async getAllCategories(req: Request, res: Response){
        const categories = await categoryRepo.find()

        res.json({success:true, categories})
    }

}