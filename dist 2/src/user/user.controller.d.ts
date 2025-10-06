import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
export declare class UserController {
    private readonly userService;
    constructor(userService: UserService);
    createUser(createUserDto: CreateUserDto): Promise<{
        id: string;
        email: string;
        name: string | null;
        createdAt: Date | null;
    }>;
}
