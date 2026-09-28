import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { CustomBaseEntity } from 'src/entities/custom-base.entity';
import { Chatroom } from './chatroom.entity';
import { User } from './user.entity';

@Entity('messages')
@Index(['chatroomId', 'createdAt'])
export class Message extends CustomBaseEntity {
  @Column()
  chatroomId: string;

  @ManyToOne(() => Chatroom, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'chatroomId' })
  chatroom: Chatroom;

  @Column()
  senderId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'senderId' })
  sender: User;

  @Column({ type: 'text' })
  content: string;
}