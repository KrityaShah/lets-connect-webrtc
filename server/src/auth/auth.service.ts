import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { OtpPurpose } from 'src/entities/otp.entity';
import { OtpService } from '../otp/otp.service';
import { User } from 'src/entities/user.entity';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
    private readonly otpService: OtpService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.create({
      email: dto.email,
      passwordHash,
      displayName: dto.displayName,
      isVerified: false,
    });

    const code = await this.otpService.create(
      user.id,
      OtpPurpose.EMAIL_VERIFICATION,
    );
    await this.mailService.sendVerificationOtp(
      user.email,
      user.displayName,
      code,
    );

    return {
      message: 'Registered. Check your email for the verification code.',
    };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid email or code');

    await this.otpService.verify(
      user.id,
      OtpPurpose.EMAIL_VERIFICATION,
      dto.code,
    );
    await this.usersService.markVerified(user.id);

    return { message: 'Email verified. You can now log in.' };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const passwordOk = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordOk) throw new UnauthorizedException('Invalid credentials');

    if (!user.isVerified) {
      throw new UnauthorizedException('Email not verified');
    }

    const tokens = this.generateTokens(user.id, user.email);
    return {
      message: 'Logged in successfully',
      user: { id: user.id, email: user.email, displayName: user.displayName },
      ...tokens,
    };
  }

  async refresh(refreshToken: string) {
    if (!refreshToken) throw new UnauthorizedException('Refresh token missing');

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(
        refreshToken,
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        },
      );

      const tokens = this.generateTokens(payload.sub, payload.email);
      return { message: 'Tokens refreshed successfully', ...tokens };
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async logout() {
    // Stateless — nothing stored server-side to invalidate.
    // The client just deletes both tokens locally.
    return { message: 'Logged out successfully' };
  }

  private generateTokens(userId: string, email: string) {
    const payload: JwtPayload = { sub: userId, email };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.get<string>(
        'JWT_ACCESS_EXPIRES_IN',
        '15m',
      ) as any,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>(
        'JWT_REFRESH_EXPIRES_IN',
        '7d',
      ) as any,
    });

    return { accessToken, refreshToken };
  }
}
