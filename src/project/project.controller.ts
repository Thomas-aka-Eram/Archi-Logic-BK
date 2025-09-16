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
// NOTE: You will need to implement an authentication guard
// For now, we will assume a user is attached to the request.
// import { AuthGuard } from '@nestjs/passport';

@Controller('projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Get()
  // @UseGuards(AuthGuard('jwt'))
  async getProjects(@Request() req) {
    // const userId = req.user.id;
    const mockUserId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    return this.projectService.getProjectsForUser(mockUserId);
  }

  @Post()
  // @UseGuards(AuthGuard('jwt')) // Example of protecting the endpoint
  async createProject(
    @Body(new ValidationPipe()) createProjectDto: CreateProjectDto,
    @Request() req,
  ) {
    // In a real app, the user ID would come from the authenticated request, e.g., req.user.id
    // For this MVP implementation, we'll simulate it or pass it in.
    // This will need to be replaced with a real user from your auth system.
    const mockUserId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'; // Replace with actual user ID from auth
    return this.projectService.createProject(createProjectDto, mockUserId);
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
}
