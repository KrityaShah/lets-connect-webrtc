import { Column, Entity } from 'typeorm';
import { CustomBaseEntity } from '../entities/custom-base.entity';

@Entity('chatrooms')
export class Chatroom extends CustomBaseEntity {
  @Column({ type: 'varchar', nullable: true })
  name: string | null;

  @Column({ default: false })
  isGroup: boolean;

  @Column()
  createdBy: string; // userId
}