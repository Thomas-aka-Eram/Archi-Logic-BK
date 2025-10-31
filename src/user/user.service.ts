import { Injectable, ConflictException, Logger } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import type { DbType } from '../db/drizzle.module';
import { DB } from '../db/drizzle.module';
import * as schema from '../db/schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto'; // Added
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

  async findByEmail(email: string) {
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

  async findById(id: string) {
    this.logger.log(`Searching for user with id: ${id}`);
    const user = await this.db.select().from(users).where(eq(users.id, id));

    if (user.length > 0) {
      this.logger.log(`User with id ${id} found.`);
      return user[0];
    }

    this.logger.log(`User with id ${id} not found.`);
    return undefined;
  }

  async updateGithubAccessToken(userId: string, accessToken: string) {
    this.logger.log(`Updating github access token for user ID: ${userId}`);
    await this.db
      .update(schema.users)
      .set({
        githubAccessToken: accessToken,
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, userId));
  }

  async getProfile(userId: string) {
    this.logger.log(`Fetching profile for user ID: ${userId}`);
    const userProfile = await this.db.query.users.findFirst({
      where: eq(schema.users.id, userId),
      columns: {
        id: true,
        email: true,
        name: true,
        timezone: true,
        language: true,
        theme: true,
      },
    });

    if (!userProfile) {
      throw new ConflictException('User profile not found.');
    }
    return userProfile;
  }

  async updateProfile(userId: string, updateData: UpdateUserProfileDto) {
    this.logger.log(`Updating profile for user ID: ${userId}`);
    const { fullName, email, ...rest } = updateData;

    const [updatedUser] = await this.db
      .update(schema.users)
      .set({
        ...(fullName && { name: fullName }),
        ...(email && { email }),
        ...rest,
        updatedAt: new Date(), // Assuming updatedAt exists in schema, add if not
      })
      .where(eq(schema.users.id, userId))
      .returning({
        id: schema.users.id,
        email: schema.users.email,
        name: schema.users.name,
        timezone: schema.users.timezone,
        language: schema.users.language,
        theme: schema.users.theme,
      });

    if (!updatedUser) {
      throw new ConflictException(
        'User profile not found or could not be updated.',
      );
    }
    return updatedUser;
  }

  async getNotificationPreferences(userId: string) {
    this.logger.log(`Fetching notification preferences for user ID: ${userId}`);
    const userPreferences = await this.db.query.users.findFirst({
      where: eq(schema.users.id, userId),
      columns: {
        emailNotifications: true,
        taskAssignments: true,
        reviewRequests: true,
        weeklyDigest: true,
      },
    });

    if (!userPreferences) {
      throw new ConflictException('User not found.');
    }
    return userPreferences;
  }

  async updateNotificationPreferences(
    userId: string,
    updateData: UpdateNotificationPreferencesDto,
  ) {
    this.logger.log(`Updating notification preferences for user ID: ${userId}`);
    const [updatedPreferences] = await this.db
      .update(schema.users)
      .set({
        ...updateData,
        updatedAt: new Date(), // Assuming updatedAt exists in schema, add if not
      })
      .where(eq(schema.users.id, userId))
      .returning({
        emailNotifications: schema.users.emailNotifications,
        taskAssignments: schema.users.taskAssignments,
        reviewRequests: schema.users.reviewRequests,
        weeklyDigest: schema.users.weeklyDigest,
      });

    if (!updatedPreferences) {
      throw new ConflictException(
        'User not found or preferences could not be updated.',
      );
    }
    return updatedPreferences;
  }

  async getUserById(userId: string) {
    this.logger.log(`Fetching user by ID: ${userId}`);
    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.id, userId),
      columns: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (!user) {
      this.logger.warn(`User with ID ${userId} not found.`);
      return null;
    }

    return user;
  }
}
