import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { DrizzleModule } from '../db/drizzle.module';

@Module({
  imports: [DrizzleModule],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
