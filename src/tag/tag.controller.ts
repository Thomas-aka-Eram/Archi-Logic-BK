import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  Param,
  ValidationPipe,
} from '@nestjs/common';
import { TagService } from './tag.service';
import { CreateTagDto } from './dto/create-tag.dto';
// import { AuthGuard } from '@nestjs/passport'; // Assuming you have authentication

@Controller('tags')
export class TagController {
  constructor(private readonly tagService: TagService) {}

  @Post('/project/:projectId')
  // @UseGuards(AuthGuard('jwt')) // Assuming you have authentication
  async createTag(
    @Param('projectId') projectId: string,
    @Body(new ValidationPipe()) createTagDto: CreateTagDto,
    @Req() req,
  ) {
    // const actorUserId = req.user.id; // Assuming you get user from request
    const actorUserId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'; // Hardcoded for now
    return this.tagService.createTag(projectId, createTagDto, actorUserId);
  }
}
