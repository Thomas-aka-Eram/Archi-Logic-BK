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
  Patch,
  Query,
} from '@nestjs/common';
import { ProjectService } from './project.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { AddProjectMemberDto } from './dto/add-project-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
// NOTE: You will need to implement an authentication guard
// For now, we will assume a user is attached to the request.
// import { AuthGuard } from '@nestjs/passport';

import { DocumentService } from '../document/document.service';
import { CreateDocumentDto } from '../document/dto/create-document.dto';

@Controller('projects')
export class ProjectController {
  constructor(
    private readonly projectService: ProjectService,
    private readonly documentService: DocumentService,
  ) {}

  @Post(':projectId/documents')
  @UseGuards(JwtAuthGuard)
  async createDocument(
    @Request() req,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body(new ValidationPipe()) createDocumentDto: CreateDocumentDto,
  ) {
    console.log('createDocument called');
    return this.documentService.createDocument(
      projectId,
      createDocumentDto,
      req.user.userId,
    );
  }

  @Get(':projectId/documents')
  @UseGuards(JwtAuthGuard)
  async getDocumentsForProject(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Query('phase') phaseKey?: string,
  ) {
    return this.documentService.getDocumentsForProject(projectId, phaseKey);
  }

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
    const userId = req.user.userId; // Use the authenticated userId
    console.log('Authenticated userId:', userId);
    return this.projectService.createProject(createProjectDto, userId);
  }

  @Get(':id/members')
  @UseGuards(JwtAuthGuard)
  async getProjectMembers(@Param('id', ParseUUIDPipe) projectId: string) {
    return this.projectService.getProjectMembers(projectId);
  }

  @Post(':id/members')
  // @UseGuards(AuthGuard('jwt'))
  async addProjectMember(
    @Param('id', ParseUUIDPipe) projectId: string,
    @Body(new ValidationPipe()) addProjectMemberDto: AddProjectMemberDto,
  ) {
    return this.projectService.addProjectMember(projectId, addProjectMemberDto);
  }

  @Patch(':projectId/members/:userId')
  @UseGuards(JwtAuthGuard)
  async updateMemberRole(
    @Request() req,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('userId', ParseUUIDPipe) targetUserId: string,
    @Body(new ValidationPipe()) updateMemberRoleDto: UpdateMemberRoleDto,
  ) {
    return this.projectService.updateMemberRole(
      req.user.userId,
      projectId,
      targetUserId,
      updateMemberRoleDto.role,
    );
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
