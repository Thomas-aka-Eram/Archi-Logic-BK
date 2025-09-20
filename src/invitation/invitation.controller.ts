
import { Controller, Post, Body, Req, UseGuards, Param, ValidationPipe } from '@nestjs/common';
import { InvitationService } from './invitation.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { JoinByCodeDto } from './dto/join-by-code.dto';

@Controller('invitations')
export class InvitationController {
  constructor(private readonly invitationService: InvitationService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createInvitation(
    @Req() req,
    @Body(new ValidationPipe()) createInvitationDto: CreateInvitationDto,
  ) {
    return this.invitationService.create(req.user.userId, createInvitationDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/revoke/:id')
  async revokeInvitation(@Req() req, @Param('id') invitationId: string) {
    return this.invitationService.revoke(req.user.userId, invitationId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/join')
  async joinByCode(@Req() req, @Body() joinByCodeDto: JoinByCodeDto) {
    return this.invitationService.joinByCode(req.user.userId, joinByCodeDto.code);
  }
}
