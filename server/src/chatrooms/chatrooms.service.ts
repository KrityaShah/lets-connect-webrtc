import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chatroom } from '../entities/chatroom.entity';
import { ChatroomMember, ChatroomRole } from '../entities/chatroom-member.entity';

@Injectable()
export class ChatroomsService {
  constructor(
    @InjectRepository(Chatroom)
    private readonly chatroomRepo: Repository<Chatroom>,
    @InjectRepository(ChatroomMember)
    private readonly memberRepo: Repository<ChatroomMember>,
  ) {}

  /** Finds an existing 1:1 room between two users, or creates one. */
  async findOrCreateDm(userIdA: string, userIdB: string): Promise<Chatroom> {
    // Find all non-group rooms userA is in.
    const candidateMemberships = await this.memberRepo.find({
      where: { userId: userIdA },
      relations: { chatroom: true },
    });

    for (const membership of candidateMemberships) {
      if (membership.chatroom.isGroup) continue;

      const members = await this.memberRepo.find({
        where: { chatroomId: membership.chatroomId },
      });

      const memberIds = members.map((m) => m.userId).sort();
      const targetIds = [userIdA, userIdB].sort();

      if (
        memberIds.length === 2 &&
        memberIds[0] === targetIds[0] &&
        memberIds[1] === targetIds[1]
      ) {
        return membership.chatroom; // existing DM found
      }
    }

    // None found — create it.
    const chatroom = await this.chatroomRepo.save(
      this.chatroomRepo.create({
        name: null,
        isGroup: false,
        createdBy: userIdA,
      }),
    );

    await this.memberRepo.save([
      this.memberRepo.create({
        chatroomId: chatroom.id,
        userId: userIdA,
        role: ChatroomRole.OWNER,
      }),
      this.memberRepo.create({
        chatroomId: chatroom.id,
        userId: userIdB,
        role: ChatroomRole.MEMBER,
      }),
    ]);

    return chatroom;
  }

  /** All chatrooms a user belongs to. */
  async listForUser(userId: string): Promise<Chatroom[]> {
    const memberships = await this.memberRepo.find({
      where: { userId },
      relations: { chatroom: true },
    });
    return memberships.map((m) => m.chatroom);
  }

  async isMember(chatroomId: string, userId: string): Promise<boolean> {
    const found = await this.memberRepo.findOne({ where: { chatroomId, userId } });
    return !!found;
  }

  async getRoomOrThrow(chatroomId: string): Promise<Chatroom> {
    const room = await this.chatroomRepo.findOne({ where: { id: chatroomId } });
    if (!room) throw new NotFoundException('Chatroom not found');
    return room;
  }
}