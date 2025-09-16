import { Controller, Post, Body, ValidationPipe } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async createUser(@Body(new ValidationPipe()) createUserDto: CreateUserDto) {
    return this.userService.createUser(createUserDto);
  }
}
