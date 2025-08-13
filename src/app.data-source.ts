import { DataSource } from "typeorm";
import 'dotenv/config'

export const myDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASS,
    database: process.env.DATABASE_DBNAME,
    entities: [__dirname+'/entities/*.{ts,js}'],
    ssl: true,
    extra: {
        ssl: {rejectUnauthorized: false},
        connectionTimeoutMillis: 5000,
        idleTimeoutMillis: 30000, 
    },
    poolSize: 5, 
    logging: ['error'], // 
    synchronize: true,
    subscribers: [],
    migrations: []
}) 