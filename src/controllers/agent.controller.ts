import { Response, Request } from "express";
import { myDataSource } from "../app.data-source.js";
import { SupportAgent } from "../entities/support-agent.entity";
import { AgentService } from "../services/agent.service";

const agentRepo = myDataSource.getRepository(SupportAgent)
const agentService = new AgentService()
export class AgentController {
    async getAllAgents(req: Request, res: Response){
        const agents = await agentRepo.find()
        res.json({success:true, agents})
    }

    async getAgent(req: Request, res: Response){
        const {id} = req.params
        const agent = await agentRepo.findOne({where:{id}})
        res.json({success:true, agent})
    }

    async createSupportAgent(req: Request, res: Response){
        const data = req.body

        agentService.newAgent(data)
        .then((supportAgent)=>{
            res.status(201).json({message: 'Support Agent created successfully', success: true, supportAgent})
        }).catch((error)=>{
            res.status(400).json({message: error.message, success: false})
        })
        
    }

    async getCategoryAgents(req: Request, res: Response){
        const {categoryId} = req.params
        
        const agents = await agentRepo.find({where: {serviceCategory: {id: categoryId}}})

        res.json({success:true, agents})
    }

}