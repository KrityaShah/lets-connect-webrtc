import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomInt } from 'crypto';
import { LessThan, Repository } from 'typeorm';
import { Otp, OtpPurpose } from 'src/entities/otp.entity';

const OTP_TTL_MINUTES = 10;
const MAX_ATTEMPTS = 5;

@Injectable()
export class OtpService {
  constructor(
    @InjectRepository(Otp) private readonly otpRepo: Repository<Otp>,
    private readonly config: ConfigService,
  ) {}

  private hash(code: string): string {
    const pepper = this.config.get<string>('OTP_PEPPER', '');
    return createHash('sha256').update(code + pepper).digest('hex');
  }

  private generateCode(): string {
    return randomInt(0, 1_000_000).toString().padStart(6, '0');
  }

  async create(userId: string, purpose: OtpPurpose): Promise<string> {
    await this.otpRepo.update(
      { userId, purpose, consumed: false },
      { consumed: true }, // invalidate old codes so only the latest is valid
    );

    const code = this.generateCode();
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60_000);

    await this.otpRepo.save(
      this.otpRepo.create({
        userId,
        purpose,
        codeHash: this.hash(code),
        expiresAt,
      }),
    );

    return code; // caller (auth service) emails this — never logged or returned to the client directly
  }

  async verify(userId: string, purpose: OtpPurpose, code: string): Promise<void> {
    const otp = await this.otpRepo.findOne({
      where: { userId, purpose, consumed: false },
      order: { createdAt: 'DESC' },
    });

    if (!otp) throw new UnauthorizedException('No active verification code');

    if (otp.expiresAt < new Date()) {
      throw new UnauthorizedException('Verification code expired');
    }

    if (otp.attempts >= MAX_ATTEMPTS) {
      throw new UnauthorizedException('Too many attempts, request a new code');
    }

    if (otp.codeHash !== this.hash(code)) {
      await this.otpRepo.increment({ id: otp.id }, 'attempts', 1);
      throw new UnauthorizedException('Invalid verification code');
    }

    await this.otpRepo.update(otp.id, { consumed: true });
  }

  async purgeExpired(): Promise<void> {
    await this.otpRepo.delete({ expiresAt: LessThan(new Date()) });
  }
}