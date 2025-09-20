// src/project/project.controller.ts
import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  ValidationPipe,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ProjectService } from './project.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { AddProjectMemberDto } from './dto/add-project-member.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
// NOTE: You will need to implement an authentication guard
// For now, we will assume a user is attached to the request.
// import { AuthGuard } from '@nestjs/passport';

@Controller('projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getProjects(@Request() req) {
    console.log('GET /api/projects received');
    const userId = req.user.userId;
    console.log('Authenticated userId for getProjects:', userId);
    const projects = await this.projectService.getProjectsForUser(userId);
    console.log('Returning projects for user:', projects);
    return projects;
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createProject(
    @Body(new ValidationPipe()) createProjectDto: CreateProjectDto,
    @Request() req,
  ) {
    console.log('POST /api/projects received');
    console.log('Request body:', createProjectDto);
    const userId = req.user.userId;
    console.log('Authenticated userId:', userId);
    return this.projectService.createProject(createProjectDto, userId);
  }

  @Post(':id/members')
  // @UseGuards(AuthGuard('jwt'))
  async addProjectMember(
    @Param('id', ParseUUIDPipe) projectId: string,
    @Body(new ValidationPipe()) addProjectMemberDto: AddProjectMemberDto,
  ) {
    return this.projectService.addProjectMember(projectId, addProjectMemberDto);
  }

  @Get(':id/phases')
  // @UseGuards(AuthGuard('jwt'))
  async getProjectPhases(@Param('id', ParseUUIDPipe) projectId: string) {
    return this.projectService.getProjectPhases(projectId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getProjectById(@Param('id', ParseUUIDPipe) projectId: string) {
    console.log(`GET /api/projects/${projectId} received`);
    return this.projectService.getProjectById(projectId);
  }
}
