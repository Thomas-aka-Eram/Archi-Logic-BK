import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { DomainService } from './domain.service';
import { CreateDomainDto } from './dto/create-domain.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('domains')
export class DomainController {
  constructor(private readonly domainService: DomainService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createDomainDto: CreateDomainDto, @Req() req) {
    const userId = req.user.userId;
    return this.domainService.create(createDomainDto, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Query('projectId') projectId: string) {
    return this.domainService.findAll(projectId);
  }
}
