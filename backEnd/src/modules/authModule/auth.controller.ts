import {
  Body,
  Controller,
  Post,
  Res,
  Get,
  UseGuards,
  Req,
  Param,
  Delete,
} from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import type { Response } from 'express';
import { JwtAuthGuard } from './guard/jwt.guard.js';
import { CreateUserDto } from '#user/dto/createUser.dto.js';
import { CurrentUser } from './decorators/currentUser.decorator.js';
import type { AuthenticatedUser } from './types/user.js';
import { ConfigService } from '@nestjs/config';
import type { Request } from '#src/types/request.js';
import { setAuthCookies, clearAuthCookies } from './utils/authCookies.js';
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Post('refresh')
  async refresh(@Req() req: Request, @Res() res: Response) {
    const { accessToken, newRefreshToken } = await this.authService.refresh(
      req.cookies.refreshToken,
      req.cookies.deviceId,
    );

    setAuthCookies(res, this.config, {
      accessToken,
      refreshToken: newRefreshToken,
    });

    return res.status(200).json({ message: 'token refreshed successfully' });
  }

  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const { accessToken, refreshToken } = await this.authService.login(
      loginDto,
      req.cookies.deviceId,
    );

    setAuthCookies(res, this.config, {
      accessToken,
      refreshToken,
    });

    return res.status(200).json({ message: 'Logged in successfully' });
  }

  @Post('signup')
  async signup(
    @Body() createUserDto: CreateUserDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const { accessToken, refreshToken } = await this.authService.signup(
      createUserDto,
      req.cookies.deviceId,
    );

    setAuthCookies(res, this.config, {
      accessToken,
      refreshToken,
    });

    return res.status(201).json({ message: 'signed up successfully' });
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthenticatedUser) {
    const { id, username, role } = user;
    return {
      id,
      username,
      role,
    };
  }

  @Delete('logout')
  @UseGuards(JwtAuthGuard)
  async logoutCurrentDevice(
    @CurrentUser('id') userId: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    await this.authService.logoutDevice(userId, req.cookies.deviceId);

    clearAuthCookies(res, this.config);

    return res.status(200).json({ message: 'Logged out successfully' });
  }
  @Delete('logout/all')
  @UseGuards(JwtAuthGuard)
  async logoutAllDevices(
    @CurrentUser('id') userId: string,
    @Res() res: Response,
  ) {
    await this.authService.logoutAllDevices(userId);
    return res
      .status(200)
      .json({ message: 'logged out of all devices successfully' });
  }

  @Delete('logout/:deviceId')
  @UseGuards(JwtAuthGuard)
  async logoutDevice(
    @CurrentUser('id') userId: string,
    @Param('deviceId') deviceId: string,
    @Res() res: Response,
  ) {
    await this.authService.logoutDevice(userId, deviceId);
    return res
      .status(200)
      .json({ message: 'logged out of the device successfully' });
  }
}
