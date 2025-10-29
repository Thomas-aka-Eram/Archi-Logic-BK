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
  Query,
} from '@nestjs/common';
import { TaskService } from './task.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { AddTaskDependencyDto } from './dto/add-task-dependency.dto';
import { GetUnassignedTasksDto } from './dto/get-unassigned-tasks.dto';
import { AssignUsersDto } from './dto/assign-users.dto';

@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Get(':id/recommendations')
  async getRecommendations(@Param('id', ParseUUIDPipe) taskId: string) {
    return this.taskService.getRecommendations(taskId);
  }

  // This endpoint should be nested under projects, e.g., /projects/:projectId/tasks
  @Post('/project/:projectId')
  async createTask(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body(new ValidationPipe()) createTaskDto: CreateTaskDto,
    @Request() req,
  ) {
    console.log('Received createTask DTO:', createTaskDto);
    console.log('Create Task DTO:', createTaskDto);
    return this.taskService.createTask(
      projectId,
      createTaskDto,
      req.user.userId,
    );
  }

  @Get('/project/:projectId/unassigned')
  async getUnassignedTasks(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Query(new ValidationPipe({ transform: true }))
    query: GetUnassignedTasksDto,
  ) {
    return this.taskService.getUnassignedTasks(projectId, query);
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
    console.log('Received updateTask DTO:', updateTaskDto);
    const userId = req.user.userId; // Correctly access userId from req.user
    return this.taskService.updateTask(taskId, updateTaskDto, userId);
  }

  @Post(':id/dependencies')
  async addTaskDependency(
    @Param('id', ParseUUIDPipe) taskId: string,
    @Body(new ValidationPipe()) addTaskDependencyDto: AddTaskDependencyDto,
  ) {
    return this.taskService.addTaskDependency(taskId, addTaskDependencyDto);
  }
}
