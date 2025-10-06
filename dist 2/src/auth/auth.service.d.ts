import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
export declare class AuthService {
    private readonly userService;
    private readonly jwtService;
    private readonly logger;
    constructor(userService: UserService, jwtService: JwtService);
    validateUser(email: string, pass: string): Promise<any>;
    login(user: any): Promise<{
        access_token: string;
    }>;
    register(createUserDto: CreateUserDto): Promise<{
        access_token: string;
    }>;
}
