import { myDataSource } from "../app.data-source.js";
import { Client } from "../entities/client.entity.js";
import { ClientAccount, IAccount } from "../entities/client_acount.entity.js";
import { isUUID } from "class-validator";
import { SessionUser } from "../middleware/auth.middleware.js";
import { FileMetadata, IFile } from "../entities/file_metadata.entity.js";
import { ChatMessage, IChatMessage } from "../entities/message.entity.js";

const fileRepo = myDataSource.getRepository(FileMetadata)
const accountRepo = myDataSource.getRepository(ClientAccount)
const messageRepo = myDataSource.getRepository(ChatMessage)

export class FileService{

    constructor(
    ){}

    async newClientFile(data: IFile, user: SessionUser) {
        if (!data.path) {
            throw new Error("No image is provided");
        }

        return fileRepo.manager.transaction(async (transactionalEntityManager) => {
            // Get related category
            const client = await transactionalEntityManager.findOne(Client, {
                where: { id: user.id }
            });

            if (!client) throw new Error('Client not found');

            // Create file instance
            const file = fileRepo.create({
                bucket: data.bucket,
                name: data.name,
                size: data.size,
                type: data.type,
                path: data.path,
                client,
            });

            // Explicit save operation
            return await transactionalEntityManager.save(file);
        });
    }

    async newClientAccount(data: IAccount) {
        return accountRepo.manager.transaction(async (transactionalEntityManager) => {
            // Get related category
            const client = await transactionalEntityManager.findOne(Client, {
                where: { id: data.clientId }
            });

            if (!client) throw new Error('Client not found');

            // Create file instance
            const account = accountRepo.create({
                email: data.email,
                password: data.password,
                firstname: data.firstname,
                lastname: data.lastname,
                phone: data.phone,
                avatarUrl: data.avatarUrl,
                client,
            });

            // Explicit save operation
            return await transactionalEntityManager.save(account);
        });
    }

    async getClientFiles(clientId:string|null){
        if(!clientId) throw new Error('No data provided');
        if(!isUUID(clientId)) throw new Error(`Invalid Client Id: \"${clientId}\"`);
        
        const files = await fileRepo
            .createQueryBuilder("file")
            .innerJoin("file.client", "client") // Join but don't select
            .where("client.id = :id", { id: clientId })
            .getMany()

        const images = files.filter(f=>f.type=='image')
        const documents = files.filter(f=>f.type=='document')

        return {images, documents, files}
    }

    async getClientFilesByType(type: string, clientId: string){
        if(!clientId) throw new Error('No data provided');
        if(!isUUID(clientId)) throw new Error(`Invalid Client Id: \"${clientId}\"`);

        return await fileRepo
            .createQueryBuilder("file")
            .innerJoin("file.client", "client") // Join but don't select
            .where("client.id = :id", { id: clientId })
            .andWhere("file.type = :type", { type })
            .getMany()
        }

    async getClientAccounts(clientId: string){
        if(!clientId) throw new Error('No data provided');
        if(!isUUID(clientId)) throw new Error(`Invalid Client Id: \"${clientId}\"`);
        
        return await accountRepo
        .createQueryBuilder("account")
        .innerJoin("account.client", "client") // Join but don't select
        .where("client.id = :id", { id: clientId })
        .getMany()
    }
    
    async getClientFile(id: string){
        if(!isUUID(id)) throw new Error(`Invalid Id: \"${id}\"`);
        return await fileRepo.findOne({where:{id}})
    }    
    
    async getChatFile(messageId: string){
        if(!isUUID(messageId)) throw new Error(`Invalid Id: \"${messageId}\"`);
        return await fileRepo.findOne({where:{message:{id:messageId}}, relations:{message: true}})
    }
    
    // New endpoint in your backend
    async createMessageWithFile(
        messageData: IChatMessage,
        fileData?: IFile
    ) {
    return messageRepo.manager.transaction(async (transactionalEntityManager) => {
        // Create message first
        const message = transactionalEntityManager.create(ChatMessage, {
            ...messageData,
            status: 'delivered'
        });
        
        await transactionalEntityManager.save(message);

        // If file exists, create and link it
        if (fileData) {
            const fileMetadata = transactionalEntityManager.create(FileMetadata, {
                ...fileData,
                message
            });
            
            await transactionalEntityManager.save(fileMetadata);
            
            // Update message with file reference
            message.file = fileMetadata;
            await transactionalEntityManager.save(message);
        }

        return message;
    });
    }

}