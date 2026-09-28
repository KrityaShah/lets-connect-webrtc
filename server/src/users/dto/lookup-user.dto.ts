import { IsEmail } from 'class-validator';

export class LookupUserDto {
  @IsEmail()
  email: string;
}