import {
  Controller,
  Get,
  Header,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
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
}
