import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { CustomBaseEntity } from '../entities/custom-base.entity';
import { Chatroom } from './chatroom.entity';
import { User } from './user.entity';

export enum ChatroomRole {
  OWNER = 'owner',
  MEMBER = 'member',
}

@Entity('chatroom_members')
@Index(['chatroomId', 'userId'], { unique: true })
export class ChatroomMember extends CustomBaseEntity {
  @Column()
  chatroomId: string;

  @ManyToOne(() => Chatroom, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'chatroomId' })
  chatroom: Chatroom;

  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'enum', enum: ChatroomRole, default: ChatroomRole.MEMBER })
  role: ChatroomRole;
}