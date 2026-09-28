import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AuthenticatedRequest } from '../common/types/authenticated-request';
import { ChatService } from './chat.service';

@UseGuards(AuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get(':chatroomId/messages')
  async history(
    @Req() req: AuthenticatedRequest,
    @Param('chatroomId', ParseUUIDPipe) chatroomId: string,
  ) {
    const messages = await this.chatService.getHistory(chatroomId, req.user.id);
    return { messages: messages.reverse() }; // oldest first for rendering
  }
}
