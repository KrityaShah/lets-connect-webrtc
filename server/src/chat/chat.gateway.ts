import { UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WsAuthGuard } from '../auth/guards/ws-auth.guard';
import { ChatService } from './chat.service';
import { ChatroomIdDto } from './dto/chatroom-id.dto';
import { SendMessageDto } from './dto/send-message.dto';

interface AuthenticatedSocket extends Socket {
  data: { user: { id: string; email: string; displayName: string } };
}

@UseGuards(WsAuthGuard)
@WebSocketGateway({ cors: { origin: '*' }, namespace: '/chat' })
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    exceptionFactory: (errors) => new WsException(errors),
  }),
)
export class ChatGateway {
  @WebSocketServer() server: Server | undefined;

  constructor(private readonly chatService: ChatService) {}

  @SubscribeMessage('join-chatroom')
  async handleJoinChatroom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() dto: ChatroomIdDto,
  ) {
    const allowed = await this.chatService.isMember(
      dto.chatroomId,
      client.data.user.id,
    );
    if (!allowed) throw new WsException('Not a member of this chatroom');
    await client.join(dto.chatroomId);
  }

  @SubscribeMessage('leave-chatroom')
  async handleLeaveChatroom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() dto: ChatroomIdDto,
  ) {
    await client.leave(dto.chatroomId);
  }

  @SubscribeMessage('send-message')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() dto: SendMessageDto,
  ) {
    const message = await this.chatService.sendMessage(
      dto.chatroomId,
      client.data.user.id,
      dto.content,
    );

    if (!this.server) return;
    this.server.to(dto.chatroomId).emit('new-message', {
      id: message.id,
      chatroomId: message.chatroomId,
      senderId: message.senderId,
      content: message.content,
      createdAt: message.createdAt,
    });
  }
}
