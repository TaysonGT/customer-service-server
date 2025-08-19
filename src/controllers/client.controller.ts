import { Response, Request } from 'express'
import { ClientService } from "../services/client.service";

const clientService = new ClientService()

export class ClientController {

    async createClient(req: Request, res: Response){
        const data = req.body
        
        await clientService.newClient(data)
        .then(({user})=>
            res.status(201).json({success: true, message: 'Client created successfully', user})
        ).catch((error)=>
            res.status(400).json({success: false, message: error.message})
        )
    }

    async allClients(req: Request, res: Response){
        const clients = await clientService.allClients()
        res.json({success:true, clients})
    }

    async allUsers(req: Request, res: Response){
        const users = await clientService.allUsers()
        res.json({success:true, users})
    }
    
    async getClient(req: Request, res: Response){
        const {id} = req.params
        clientService.getClientById(id)
        .then((client)=>{
            if(client){
                res.json({success:true, client})
            }else{
                res.status(404).json({message: 'User not found', success:false})
            }
        }).catch((error)=> {
            res.status(500).json({message: error.message, success:false})
        })
    }
}