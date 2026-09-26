import { Logger, UsePipes, ValidationPipe } from '@nestjs/common';
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
import { Server, Socket } from 'socket.io';
import { JoinRoomDto } from './dto/join-room.dto';
import { AnswerDto, IceCandidateDto, OfferDto } from './dto/signal.dto';
import { RoomsService } from './rooms.service';

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
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(SignalingGateway.name);

  constructor(private readonly rooms: RoomsService) {}

  handleConnection(client: Socket) {
    this.logger.log(`connected ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`disconnected ${client.id}`);
    await this.leaveRoom(client);
  }

  @SubscribeMessage('join-room')
  async handleJoin(
    @ConnectedSocket() client: Socket,
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
    client.to(dto.roomId).emit('peer-joined', { peerId: client.id });
  }

  @SubscribeMessage('leave-room')
  async handleLeave(@ConnectedSocket() client: Socket) {
    await this.leaveRoom(client);
  }

  @SubscribeMessage('offer')
  handleOffer(@ConnectedSocket() client: Socket, @MessageBody() dto: OfferDto) {
    this.relay(client, 'offer', dto.to, { sdp: dto.sdp });
  }

  @SubscribeMessage('answer')
  handleAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: AnswerDto,
  ) {
    this.relay(client, 'answer', dto.to, { sdp: dto.sdp });
  }

  @SubscribeMessage('ice-candidate')
  handleIce(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: IceCandidateDto,
  ) {
    this.relay(client, 'ice-candidate', dto.to, { candidate: dto.candidate });
  }

  @SubscribeMessage('camera-toggle')
  handleCameraToggle(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: { to: string; cameraOff: boolean },
  ) {
    this.relay(client, 'camera-toggle', dto.to, { cameraOff: dto.cameraOff });
  }

  // Only relay between peers that share a room.
  private relay(
    client: Socket,
    event: string,
    to: string,
    payload: Record<string, unknown>,
  ) {
    if (!this.rooms.inSameRoom(client.id, to)) return;
    this.server.to(to).emit(event, { from: client.id, ...payload });
  }

  private async leaveRoom(client: Socket) {
    const roomId = this.rooms.leave(client.id);
    if (!roomId) return;
    await client.leave(roomId);
    this.server.to(roomId).emit('peer-left', { peerId: client.id });
  }
}
