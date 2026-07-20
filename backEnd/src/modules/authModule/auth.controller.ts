import {
  Body,
  Controller,
  Post,
  Res,
  Get,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import type { Response } from 'express';
import { JwtAuthGuard } from './guard/jwt.guard.js';
import { CreateUserDto } from '../userModule/dto/createUser.dto.js';
import type { Request } from '../../types/request.js';
import { Roles } from './decorators/roles.decorator.js';
import { UserRole } from '../../generated/enums.js';
import { RolesGuard } from './guard/roles.guard.js';
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto, @Res() res: Response) {
    const token = await this.authService.login(loginDto);
    res.cookie('token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
    });
    return res.status(200).json({ message: 'logged in successfully' });
  }

  @Post('signup')
  async signup(@Body() createUserDto: CreateUserDto, @Res() res: Response) {
    const token = await this.authService.signup(createUserDto);
    res.cookie('token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
    });
    return res.status(200).json({ message: 'signed up successfully' });
  }

  @Get('me')
  @Roles(UserRole.TEACHER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  me(@Req() req: Request) {
    return req.user;
  }
}
