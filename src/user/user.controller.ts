import {
  Controller,
  Post,
  Body,
  ValidationPipe,
  Get,
  Patch,
  Request,
  UseGuards,
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
    return this.userService.getProfile(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async updateProfile(
    @Request() req,
    @Body(new ValidationPipe()) updateUserProfileDto: UpdateUserProfileDto,
  ) {
    return this.userService.updateProfile(req.user.userId, updateUserProfileDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('notifications')
  async getNotificationPreferences(@Request() req) {
    return this.userService.getNotificationPreferences(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('notifications')
  async updateNotificationPreferences(
    @Request() req,
    @Body(new ValidationPipe())
    updateNotificationPreferencesDto: UpdateNotificationPreferencesDto,
  ) {
    return this.userService.updateNotificationPreferences(
      req.user.userId,
      updateNotificationPreferencesDto,
    );
  }
}
