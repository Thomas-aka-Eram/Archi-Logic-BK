import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { TagService } from './tag.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('tags')
export class TagController {
  constructor(private readonly tagService: TagService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createTagDto: CreateTagDto, @Req() req) {
    const userId = req.user.id;
    return this.tagService.create(createTagDto, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Query('projectId') projectId: string) {
    return this.tagService.findAll(projectId);
  }
}
