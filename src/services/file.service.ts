import { myDataSource } from "../app.data-source";
import { ClientAccount, IAccount } from "../entities/client_acount.entity";
import { isUUID } from "class-validator";
import { SessionUser } from "../middleware/auth.middleware";
import { FileMetadata, IFile } from "../entities/file_metadata.entity";
import { ChatMessage, IChatMessage } from "../entities/message.entity";
import { User } from "../entities/user.entity";

const fileRepo = myDataSource.getRepository(FileMetadata)
const accountRepo = myDataSource.getRepository(ClientAccount)
const messageRepo = myDataSource.getRepository(ChatMessage)

export class FileService{

    constructor(
    ){}

    async newUserFile(data: IFile, authUser: SessionUser) {
        if (!data.path) {
            throw new Error("No path was provided");
        }

        return fileRepo.manager.transaction(async (transactionalEntityManager) => {
            const user = await transactionalEntityManager.findOne(User, {
                where: { id: authUser.id }
            });

            if (!user) throw new Error('User not found');

            // Create file instance
            const file = fileRepo.create({
                bucket: data.bucket,
                name: data.name,
                size: data.size,
                type: data.type,
                path: data.path,
                user
            });

            // Explicit save operation
            return await transactionalEntityManager.save(file);
        });
    }

    async newClientAccount(data: IAccount) {
        return accountRepo.manager.transaction(async (transactionalEntityManager) => {
            // Get related category
            const user = await transactionalEntityManager.findOne(User, {
                where: { id: data.userId }
            });

            if (!user) throw new Error('User not found');

            // Create file instance
            const account = accountRepo.create({
                email: data.email,
                password: data.password,
                firstname: data.firstname,
                lastname: data.lastname,
                phone: data.phone,
                avatarUrl: data.avatarUrl,
                user,
            });

            // Explicit save operation
            return await transactionalEntityManager.save(account);
        });
    }

    async getUserFiles(userId:string|null){
        if(!userId) throw new Error('No data provided');
        if(!isUUID(userId)) throw new Error(`Invalid Client Id: \"${userId}\"`);
        
        const files = await fileRepo
            .createQueryBuilder("file")
            .innerJoin("file.user", "user") // Join but don't select
            .where("user.id = :id", { id: userId })
            .getMany()

        const images = files.filter(f=>f.type=='image')
        const documents = files.filter(f=>f.type=='document')

        return {images, documents, files}
    }

    async getUserFilesByType(type: string, userId: string){
        if(!userId) throw new Error('No data provided');
        if(!isUUID(userId)) throw new Error(`Invalid Client Id: \"${userId}\"`);

        return await fileRepo
            .createQueryBuilder("file")
            .innerJoin("file.user", "user") // Join but don't select
            .where("user.id = :id", { id: userId })
            .andWhere("file.type = :type", { type })
            .getMany()
        }

    async getUserAccounts(userId: string){
        if(!userId) throw new Error('No data provided');
        if(!isUUID(userId)) throw new Error(`Invalid User Id: \"${userId}\"`);
        
        return await accountRepo
        .createQueryBuilder("account")
        .innerJoin("account.user", "user") // Join but don't select
        .where("user.id = :id", { id: userId })
        .getMany()
    }
    
    async getUserFile(id: string){
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