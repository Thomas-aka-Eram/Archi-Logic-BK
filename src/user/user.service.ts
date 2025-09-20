import { Injectable, ConflictException, Logger } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import type { DbType } from '../db/drizzle.module';
import { DB } from '../db/drizzle.module';
import * as schema from '../db/schema';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(@Inject(DB) private readonly db: DbType) {}

  async createUser(createUserDto: CreateUserDto) {
    this.logger.log('Attempting to create a new user...');
    console.log('Incoming signup data from frontend:', createUserDto);

    const { email, name, password } = createUserDto;

    // Check if user already exists
    const existingUser = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (existingUser.length > 0) {
      this.logger.warn(`Registration failed: email ${email} already exists.`);
      throw new ConflictException('User with this email already exists');
    }

    // Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    this.logger.log('Password hashed successfully.');

    // Create the new user
    this.logger.log(
      `Inserting new user ${name} (${email}) into the database...`,
    );
    const newUser = await this.db
      .insert(schema.users)
      .values({
        email,
        name,
        passwordHash,
      })
      .returning({
        id: schema.users.id,
        email: schema.users.email,
        name: schema.users.name,
        createdAt: schema.users.createdAt,
      });

    console.log('Response from database after insertion:', newUser[0]);
    this.logger.log(
      `User ${newUser[0].name} created successfully with ID: ${newUser[0].id}`,
    );

    return newUser[0];
  }

  async findOne(email: string) {
    this.logger.log(`Searching for user with email: ${email}`);
    const user = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (user.length > 0) {
      this.logger.log(`User with email ${email} found.`);
      return user[0];
    }

    this.logger.log(`User with email ${email} not found.`);
    return undefined;
  }
}
