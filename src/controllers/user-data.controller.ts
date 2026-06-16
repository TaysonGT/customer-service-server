import { Response, Request } from "express";
import { FileService } from "../services/file.service";
import { AuthenticatedRequest } from "../middleware/auth.middleware";

const fileService = new FileService()

export class UserDataController {
    async getUserData(req: Request, res: Response){
        const {userId} = req.params as {userId:string}
        if(!userId){
            res.json({success:false, message: "userId not sent"})
            return
        }
        try{
            const {images, documents} = await fileService.getUserFiles(userId)
            const accounts = await fileService.getUserAccounts(userId)
            res.json({success:true, images, documents, accounts})
        }catch(error){
            res.json({success:false, message: error.message})
        }
    }

    async getFile(req: Request, res: Response){
        const {id} = req.params as {id:string}
        
        fileService.getUserFile(id)
        .then((file)=> res.json({success:true, file}))
        .catch((error)=>{
            res.json({success:false, message: error.message})
        })
    }

    async createFile(req: AuthenticatedRequest, res: Response){
        const data = req.body

        fileService.newUserFile(data, req.user)
        .then((file)=>{
            res.status(201).json({message: 'File created successfully', success: true, file})
        }).catch((error)=>{
            res.status(400).json({message: error.message, success: false})
        })
        
    }

    async getImages(req: Request, res: Response){
        const {userId} = req.params as {userId:string}
        fileService.getUserFilesByType('image', userId)
        .then((images)=>
            res.json({success:true, images})
        ).catch(error=>
            res.json({success: false, message: error.message})
        )
    }

    async getDocs(req: Request, res: Response){
        const {userId} = req.params as {userId:string}
        fileService.getUserFilesByType('document', userId)
        .then((documents)=>
            res.json({success:true, documents})
        ).catch(error=>
            res.json({success: false, message: error.message})
        )
    }

    async getAccounts(req: Request, res: Response){
        const {userId} = req.params as {userId:string}
        fileService.getUserAccounts(userId)
        .then((accounts)=>
            res.json({success:true, accounts})
        ).catch(error=>
            res.json({success: false, message: error.message})
        )
    }

}