import {
  Controller,
  Post,
  Body,
  ValidationPipe,
  Get,
  Patch,
  Request,
  UseGuards,
  Param,
  NotFoundException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto'; // Added
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async createUser(@Body(new ValidationPipe()) createUserDto: CreateUserDto) {
    return this.userService.createUser(createUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    return this.userService.getProfile(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getUserById(@Param('id') id: string) {
    const user = await this.userService.getUserById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async updateProfile(
    @Request() req,
    @Body(new ValidationPipe()) updateUserProfileDto: UpdateUserProfileDto,
  ) {
    return this.userService.updateProfile(
      req.user.id,
      updateUserProfileDto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('notifications')
  async getNotificationPreferences(@Request() req) {
    return this.userService.getNotificationPreferences(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('notifications')
  async updateNotificationPreferences(
    @Request() req,
    @Body(new ValidationPipe())
    updateNotificationPreferencesDto: UpdateNotificationPreferencesDto,
  ) {
    return this.userService.updateNotificationPreferences(
      req.user.id,
      updateNotificationPreferencesDto,
    );
  }
}
