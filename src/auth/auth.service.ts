import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from 'src/user/dto/create-user.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    this.logger.log(`Attempting to validate user: ${email}`);
    const user = await this.userService.findOne(email);

    if (!user) {
      this.logger.warn(
        `Validation failed: User not found for email - ${email}`,
      );
      return null;
    }

    if (!user.passwordHash) {
      this.logger.error(
        `Validation failed: User ${email} has no password hash.`,
      );
      return null;
    }

    this.logger.log(`User found: ${user.email}. Comparing passwords...`);
    const isPasswordMatching = await bcrypt.compare(pass, user.passwordHash);

    if (isPasswordMatching) {
      this.logger.log(`Password validation successful for user: ${email}`);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash, ...result } = user;
      return result;
    } else {
      this.logger.warn(`Password validation failed for user: ${email}`);
      return null;
    }
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, name: user.name, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(createUserDto: CreateUserDto) {
    this.logger.log(`Registering new user: ${createUserDto.email}`);
    const user = await this.userService.createUser(createUserDto);
    return this.login(user);
  }
}
