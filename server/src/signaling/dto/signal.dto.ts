import { IsNotEmpty, IsObject, IsString } from 'class-validator';

export class OfferDto {
  @IsString()
  @IsNotEmpty()
  to: string;

  @IsObject()
  sdp: Record<string, unknown>;
}

export class AnswerDto extends OfferDto {}

export class IceCandidateDto {
  @IsString()
  @IsNotEmpty()
  to: string;

  @IsObject()
  candidate: Record<string, unknown>;
}

export class CameraToggleDto {
  @IsString()
  @IsNotEmpty()
  to: string;

  @IsBoolean()
  cameraOff: boolean;
}