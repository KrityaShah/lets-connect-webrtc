// src/chatrooms/chatrooms.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { Chatroom } from '../entities/chatroom.entity';
import { ChatroomMember } from '../entities/chatroom-member.entity';
import { ChatroomsController } from './chatrooms.controller';
import { ChatroomsService } from './chatrooms.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Chatroom, ChatroomMember]),
    AuthModule,
  ],
  controllers: [ChatroomsController],
  providers: [ChatroomsService],
  exports: [ChatroomsService],
})
export class ChatroomsModule {}