import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AuthenticatedRequest } from '../common/types/authenticated-request';
import { ChatroomsService } from './chatrooms.service';
import { CreateDmDto } from './dto/create-dm.dto';

@UseGuards(AuthGuard)
@Controller('chatrooms')
export class ChatroomsController {
  constructor(private readonly chatroomsService: ChatroomsService) {}

  @Post('dm')
  async createDm(@Req() req: AuthenticatedRequest, @Body() dto: CreateDmDto) {
    const room = await this.chatroomsService.findOrCreateDm(
      req.user.id,
      dto.targetUserId,
    );
    return { chatroom: room };
  }

  @Get()
  async listMine(@Req() req: AuthenticatedRequest) {
    const rooms = await this.chatroomsService.listForUser(req.user.id);
    return { chatrooms: rooms };
  }
}