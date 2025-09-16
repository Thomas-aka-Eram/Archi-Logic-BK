import { Controller, Get, Header, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Header('Content-Type', 'text/html')
  async getUsers() {
    const users = await this.appService.getUsers();
    if (users.length === 0) {
      return '<h1>No users found in the database.</h1>';
    }
    const userList = users
      .map((user) => `<li>Name: ${user.name}, Email: ${user.email}</li>`)
      .join('');
    return `<h1>User List</h1><ul>${userList}</ul>`;
  }

  // Placeholder Login Endpoint
  @Post('auth/login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() signInDto: Record<string, any>) {
    // In a real application, you would validate the user's credentials
    // against the database and return a JWT.
    // For now, we'll just return a mock token.
    console.log('Login attempt with:', signInDto);
    return {
      access_token: 'mock-jwt-token-for-testing-purposes',
    };
  }
}
