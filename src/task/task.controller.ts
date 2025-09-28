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
  UseGuards,
} from '@nestjs/common';
import { TaskService } from './task.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { AddTaskDependencyDto } from './dto/add-task-dependency.dto';
import { AssignUsersDto } from './dto/assign-users.dto';

import { GetAssignmentSuggestionsDto } from './dto/get-assignment-suggestions.dto';

@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post('suggestions')
  async getAssignmentSuggestions(
    @Body(new ValidationPipe()) getAssignmentSuggestionsDto: GetAssignmentSuggestionsDto,
  ) {
    return this.taskService.getAssignmentSuggestions(
      getAssignmentSuggestionsDto.projectId,
      getAssignmentSuggestionsDto,
    );
  }

  // This endpoint should be nested under projects, e.g., /projects/:projectId/tasks
  @Post('/project/:projectId')
  async createTask(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body(new ValidationPipe()) createTaskDto: CreateTaskDto,
    @Request() req,
  ) {
    console.log("Create Task DTO:", createTaskDto);
    const mockUserId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'; // Replace with actual user ID from auth
    return this.taskService.createTask(projectId, createTaskDto, mockUserId);
  }

  @Get('/project/:projectId')
  async getTasksForProject(
    @Param('projectId', ParseUUIDPipe) projectId: string,
  ) {
    return this.taskService.getTasksForProject(projectId);
  }

  @Get(':id')
  async getTaskById(@Param('id', ParseUUIDPipe) taskId: string) {
    return this.taskService.getTaskById(taskId);
  }

  @Patch(':id')
  async updateTask(
    @Param('id', ParseUUIDPipe) taskId: string,
    @Body(new ValidationPipe()) updateTaskDto: UpdateTaskDto,
    @Request() req,
  ) {
    const userId = req.user.userId; // Correctly access userId from req.user
    return this.taskService.updateTask(taskId, updateTaskDto, userId);
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
