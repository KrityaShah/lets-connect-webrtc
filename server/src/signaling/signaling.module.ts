import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { RoomsService } from './rooms.service';
import { SignalingGateway } from './signaling.gateway';

@Module({
  imports: [UsersModule, JwtModule.register({})],
  providers: [SignalingGateway, RoomsService],
})
export class SignalingModule {}