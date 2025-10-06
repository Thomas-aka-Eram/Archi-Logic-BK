import { AuthService } from './auth.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(createUserDto: CreateUserDto): Promise<{
        access_token: string;
    }>;
    login(req: any, loginDto: LoginDto): Promise<{
        access_token: string;
    }>;
    getProfile(req: any): any;
}
