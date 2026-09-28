import { IsUUID } from 'class-validator';

export class ChatroomIdDto {
  @IsUUID()
  chatroomId: string;
}
