import { Body, Controller, Post, Res, Get, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import type { Response } from 'express';
import { JwtAuthGuard } from './guard/jwt.guard.js';
import { CreateUserDto } from '../userModule/dto/createUser.dto.js';
import { CurrentUser } from './decorators/currentUser.decorator.js';
import type { User } from 'src/generated/client.js';
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
    return res.status(200).json({ message: 'Logged in successfully' });
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
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: User) {
    const { id, username, role } = user;
    return {
      id,
      username,
      role,
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  logout(@Res() res: Response) {
    res.clearCookie('token', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
    });
    return res.status(200).json({ message: 'Logged out successfully' });
  }
}
