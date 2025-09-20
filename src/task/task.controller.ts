import {
  Controller,
  Post,
  Body,
  Param,
  ValidationPipe,
  Request,
  Patch,
  ParseUUIDPipe,
  Get,
} from '@nestjs/common';
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { AddTaskDependencyDto } from './dto/add-task-dependency.dto';
import { AssignUsersDto } from './dto/assign-users.dto';

@Controller('tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  // This endpoint should be nested under projects, e.g., /projects/:projectId/tasks
  @Post('/project/:projectId')
  async createTask(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body(new ValidationPipe()) createTaskDto: CreateTaskDto,
    @Request() req,
  ) {
    const mockUserId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'; // Replace with actual user ID from auth
    return this.taskService.createTask(projectId, createTaskDto, mockUserId);
  }

  @Get('/project/:projectId')
  async getTasksForProject(
    @Param('projectId', ParseUUIDPipe) projectId: string,
  ) {
    return this.taskService.getTasksForProject(projectId);
  }

  @Patch(':id')
  async updateTask(
    @Param('id', ParseUUIDPipe) taskId: string,
    @Body(new ValidationPipe()) updateTaskDto: UpdateTaskDto,
  ) {
    return this.taskService.updateTask(taskId, updateTaskDto);
  }

  @Post(':id/assign')
  async assignMultipleUsers(
    @Param('id', ParseUUIDPipe) taskId: string,
    @Body(new ValidationPipe()) assignUsersDto: AssignUsersDto,
  ) {
    return this.taskService.assignMultipleUsers(
      taskId,
      assignUsersDto.assignments,
    );
  }

  @Post(':id/dependencies')
  async addTaskDependency(
    @Param('id', ParseUUIDPipe) taskId: string,
    @Body(new ValidationPipe()) addTaskDependencyDto: AddTaskDependencyDto,
  ) {
    return this.taskService.addTaskDependency(taskId, addTaskDependencyDto);
  }
}
