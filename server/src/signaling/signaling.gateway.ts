import { Logger, UnauthorizedException, UseGuards } from '@nestjs/common';
import { UsePipes, ValidationPipe } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { UsersService } from '../users/users.service';
import { WsAuthGuard } from '../auth/guards/ws-auth.guard';
import { JoinRoomDto } from './dto/join-room.dto';
import { AnswerDto, IceCandidateDto, OfferDto } from './dto/signal.dto';
import { RoomsService } from './rooms.service';

interface AuthenticatedSocket extends Socket {
  data: {
    user: { id: string; email: string; displayName: string };
  };
}

@UseGuards(WsAuthGuard)
@WebSocketGateway({ cors: { origin: '*' } })
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    exceptionFactory: (errors) => new WsException(errors),
  }),
)
export class SignalingGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server | undefined;
  private readonly logger = new Logger(SignalingGateway.name);

  constructor(
    private readonly rooms: RoomsService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  // WsAuthGuard only runs on @SubscribeMessage handlers, not on the raw
  // connection itself — so we also verify here to reject bad tokens
  // immediately instead of waiting for the client's first message.
  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token =
        (client.handshake.auth?.token as string | undefined) ??
        (client.handshake.headers?.authorization as string | undefined)?.split(
          ' ',
        )[1];

      if (!token) throw new UnauthorizedException('Missing auth token');

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      });

      const user = await this.usersService.findById(payload.sub);
      if (!user) throw new UnauthorizedException('User not found');

      client.data.user = {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
      };

      this.logger.log(`connected ${client.id} (user ${user.id})`);
    } catch {
      this.logger.warn(`rejected connection ${client.id}: bad token`);
      client.disconnect(true);
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(`disconnected ${client.id}`);
    await this.leaveRoom(client);
  }

  @SubscribeMessage('join-room')
  async handleJoin(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() dto: JoinRoomDto,
  ) {
    await this.leaveRoom(client); // one room at a time

    const result = this.rooms.join(dto.roomId, client.id);
    if (!result.ok) {
      client.emit('room-full', { roomId: dto.roomId });
      return;
    }

    await client.join(dto.roomId);
    // The joiner creates offers to everyone already in the room.
    client.emit('room-joined', {
      roomId: dto.roomId,
      selfId: client.id,
      peers: result.peers,
    });
    client.to(dto.roomId).emit('peer-joined', {
      peerId: client.id,
      user: client.data.user,
    });
  }

  @SubscribeMessage('leave-room')
  async handleLeave(@ConnectedSocket() client: AuthenticatedSocket) {
    await this.leaveRoom(client);
  }

  @SubscribeMessage('offer')
  handleOffer(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() dto: OfferDto,
  ) {
    this.relay(client, 'offer', dto.to, { sdp: dto.sdp });
  }

  @SubscribeMessage('answer')
  handleAnswer(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() dto: AnswerDto,
  ) {
    this.relay(client, 'answer', dto.to, { sdp: dto.sdp });
  }

  @SubscribeMessage('ice-candidate')
  handleIce(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() dto: IceCandidateDto,
  ) {
    this.relay(client, 'ice-candidate', dto.to, { candidate: dto.candidate });
  }

  @SubscribeMessage('camera-toggle')
  handleCameraToggle(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() dto: { to: string; cameraOff: boolean },
  ) {
    this.relay(client, 'camera-toggle', dto.to, { cameraOff: dto.cameraOff });
  }

  // Only relay between peers that share a room.
  private relay(
    client: AuthenticatedSocket,
    event: string,
    to: string,
    payload: Record<string, unknown>,
  ) {
    if (!this.rooms.inSameRoom(client.id, to)) return;
    if (!this.server) return;
    this.server.to(to).emit(event, { from: client.id, ...payload });
  }

  private async leaveRoom(client: AuthenticatedSocket) {
    const roomId = this.rooms.leave(client.id);
    if (!roomId) return;
    await client.leave(roomId);
    if (!this.server) return;
    this.server.to(roomId).emit('peer-left', { peerId: client.id });
  }
}