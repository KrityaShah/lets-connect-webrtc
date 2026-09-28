import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatroomsService } from '../chatrooms/chatrooms.service';
import { Message } from '../entities/message.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
    private readonly chatroomsService: ChatroomsService,
  ) {}

  isMember(chatroomId: string, userId: string) {
    return this.chatroomsService.isMember(chatroomId, userId);
  }

  async sendMessage(chatroomId: string, senderId: string, content: string): Promise<Message> {
    const isMember = await this.chatroomsService.isMember(chatroomId, senderId);
    if (!isMember) throw new ForbiddenException('Not a member of this chatroom');

    return this.messageRepo.save(
      this.messageRepo.create({ chatroomId, senderId, content }),
    );
  }

  async getHistory(chatroomId: string, userId: string, limit = 50): Promise<Message[]> {
    const isMember = await this.chatroomsService.isMember(chatroomId, userId);
    if (!isMember) throw new ForbiddenException('Not a member of this chatroom');

    return this.messageRepo.find({
      where: { chatroomId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}