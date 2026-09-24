import { Module } from '@nestjs/common';
import { SignalingGateway } from './signaling.gateway';
import { RoomsService } from './rooms.service';

@Module({
  providers: [SignalingGateway, RoomsService]
})
export class SignalingModule {}
