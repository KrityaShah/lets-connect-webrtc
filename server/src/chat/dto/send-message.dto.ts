import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class SendMessageDto {
  @IsUUID()
  chatroomId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  content: string;
}