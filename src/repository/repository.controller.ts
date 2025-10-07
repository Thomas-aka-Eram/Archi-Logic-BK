import {
  Controller,
  Post,
  Body,
  Param,
  ValidationPipe,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { RepositoryService } from './repository.service';
import { AddRepositoryDto } from './dto/add-repository.dto';

@Controller('repositories')
export class RepositoryController {
  constructor(private readonly repositoryService: RepositoryService) {}

  @Post('/project/:projectId')
  async addRepository(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body(new ValidationPipe()) addRepositoryDto: AddRepositoryDto,
    @Request() req,
  ) {
    // const userId = req.user.id;
    const { name } = addRepositoryDto;
    const mockUserId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'; // Replace with actual user ID from req.user.id
    const mockAccessToken = 'gho_mock_access_token'; // Replace with actual access token from req.user.githubAccessToken

    const createRepositoryPayload = {
      projectId,
      name,
      accessToken: mockAccessToken,
    };

    return this.repositoryService.addRepository(
      projectId,
      createRepositoryPayload,
      mockUserId,
    );
  }
}
