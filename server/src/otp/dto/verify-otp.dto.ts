import { IsEnum, IsString, IsUUID, Length } from 'class-validator';
import { OtpPurpose } from 'src/entities/otp.entity';

export class VerifyOtpDto {
  @IsUUID()
  userId: string;

  @IsEnum(OtpPurpose)
  purpose: OtpPurpose;

  @IsString()
  @Length(6, 6)
  code: string;
}