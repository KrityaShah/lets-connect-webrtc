import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class WsAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient<Socket>();

    const token =
      (client.handshake.auth?.token as string | undefined) ??
      (client.handshake.headers?.authorization as string | undefined)?.split(' ')[1];

    if (!token) {
      throw new UnauthorizedException('Missing auth token');
    }

    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      });

      const user = await this.usersService.findById(payload.sub);
      if (!user) throw new UnauthorizedException('User not found');

      // Attach the user to the socket itself, since WS has no per-request object like HTTP does.
      (client as Socket & { user: typeof user }).user = user;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }
}