import { Response, Request } from "express";
import { FileService } from "../services/file.service.js";
import { AuthenticatedRequest } from "../middleware/auth.middleware.js";

const fileService = new FileService()

export class ClientDataController {
    async getClientData(req: Request, res: Response){
        if(!req.params.clientId){
            res.json({success:false, message: "clientId not sent"})
            return
        }
        try{
            const {images, documents} = await fileService.getClientFiles(req.params.clientId)
            const accounts = await fileService.getClientAccounts(req.params.clientId)
            res.json({success:true, images, documents, accounts})
        }catch(error){
            res.json({success:false, message: error.message})
        }
    }

    async getFile(req: Request, res: Response){
        const {id} = req.params
        
        fileService.getClientFile(id)
        .then((file)=> res.json({success:true, file}))
        .catch((error)=>{
            res.json({success:false, message: error.message})
        })
    }

    async createFile(req: AuthenticatedRequest, res: Response){
        const data = req.body

        console.log(req.user)

        fileService.newClientFile(data, req.user)
        .then((file)=>{
            res.status(201).json({message: 'File created successfully', success: true, file})
        }).catch((error)=>{
            res.status(400).json({message: error.message, success: false})
        })
        
    }

    async getImages(req: Request, res: Response){
        fileService.getClientFilesByType('image', req.params.clientId)
        .then((images)=>
            res.json({success:true, images})
        ).catch(error=>
            res.json({success: false, message: error.message})
        )
    }

    async getDocs(req: Request, res: Response){
        fileService.getClientFilesByType('document', req.params.clientId)
        .then((documents)=>
            res.json({success:true, documents})
        ).catch(error=>
            res.json({success: false, message: error.message})
        )
    }

    async getAccounts(req: Request, res: Response){
        fileService.getClientAccounts(req.params.clientId)
        .then((accounts)=>
            res.json({success:true, accounts})
        ).catch(error=>
            res.json({success: false, message: error.message})
        )
    }

}