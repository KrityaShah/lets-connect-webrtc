import { IsEnum, IsUUID } from 'class-validator';
import { OtpPurpose } from 'src/entities/otp.entity';

export class CreateOtpDto {
  @IsUUID()
  userId: string;

  @IsEnum(OtpPurpose)
  purpose: OtpPurpose;
}