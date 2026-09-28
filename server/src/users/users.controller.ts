import { Controller, Get, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { LookupUserDto } from './dto/lookup-user.dto';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

  @Get('lookup')
  async lookup(@Query() dto: LookupUserDto) {
    const user = await this.usersService.findPublicByEmail(dto.email);
    return { user: user ?? null };
  }
}
