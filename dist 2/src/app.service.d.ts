import { type DbType } from './db/drizzle.module';
export declare class AppService {
    private db;
    constructor(db: DbType);
    getUsers(): Promise<{
        id: string;
        email: string;
        name: string | null;
        passwordHash: string | null;
        role: string | null;
        createdAt: Date | null;
    }[]>;
}
