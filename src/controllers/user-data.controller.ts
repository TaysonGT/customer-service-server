import { Response, Request } from "express";
import { FileService } from "../services/file.service";
import { AuthenticatedRequest } from "../middleware/auth.middleware";

const fileService = new FileService()

export class UserDataController {
    async getUserData(req: Request, res: Response){
        if(!req.params.userId){
            res.json({success:false, message: "userId not sent"})
            return
        }
        try{
            const {images, documents} = await fileService.getUserFiles(req.params.userId)
            const accounts = await fileService.getUserAccounts(req.params.userId)
            res.json({success:true, images, documents, accounts})
        }catch(error){
            res.json({success:false, message: error.message})
        }
    }

    async getFile(req: Request, res: Response){
        const {id} = req.params
        
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
        fileService.getUserFilesByType('image', req.params.userId)
        .then((images)=>
            res.json({success:true, images})
        ).catch(error=>
            res.json({success: false, message: error.message})
        )
    }

    async getDocs(req: Request, res: Response){
        fileService.getUserFilesByType('document', req.params.userId)
        .then((documents)=>
            res.json({success:true, documents})
        ).catch(error=>
            res.json({success: false, message: error.message})
        )
    }

    async getAccounts(req: Request, res: Response){
        fileService.getUserAccounts(req.params.userId)
        .then((accounts)=>
            res.json({success:true, accounts})
        ).catch(error=>
            res.json({success: false, message: error.message})
        )
    }

}