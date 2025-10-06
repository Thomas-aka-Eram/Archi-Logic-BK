import type { DbType } from '../db/drizzle.module';
import { CreateUserDto } from './dto/create-user.dto';
export declare class UserService {
    private readonly db;
    private readonly logger;
    constructor(db: DbType);
    createUser(createUserDto: CreateUserDto): Promise<{
        id: string;
        email: string;
        name: string | null;
        createdAt: Date | null;
    }>;
    findOne(email: string): Promise<{
        id: string;
        email: string;
        name: string | null;
        passwordHash: string | null;
        role: string | null;
        createdAt: Date | null;
    } | undefined>;
}
