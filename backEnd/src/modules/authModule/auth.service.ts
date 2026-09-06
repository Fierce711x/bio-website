import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PasswordService } from '#password/password.service.js';
import { UserService } from '#user/user.service.js';
import { LoginDto } from './dto/login.dto.js';
import { CreateUserDto } from '#user/dto/createUser.dto.js';
import crypto from 'crypto';
import { PrismaService } from '#prisma/prisma.service.js';
import { ConfigService } from '@nestjs/config';
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly jwtService: JwtService,
    private readonly passwordService: PasswordService,
    private readonly userService: UserService,
    private readonly prisma: PrismaService,
  ) {}
  async handleInvalidOrReusedRefreshToken(
    refreshTokenHash: string,
    deviceId: string,
  ): Promise<never> {
    const usedToken = await this.prisma.usedRefreshToken.findUnique({
      where: {
        tokenHash: refreshTokenHash,
      },
      include: {
        session: true,
      },
    });

    if (usedToken && usedToken.session.deviceId === deviceId) {
      await this.prisma.session.delete({
        where: {
          id: usedToken.sessionId,
        },
      });
      this.logger.log('reuse of refresh token detected');
    } else this.logger.log('invalid refersh token');

    throw new UnauthorizedException('invalid refresh token');
  }

  async refresh(
    refreshToken: string | undefined,
    deviceId: string | undefined,
  ) {
    if (!deviceId) throw new BadRequestException('no device id');
    if (!refreshToken) throw new UnauthorizedException('invalid refresh token');

    const refreshTokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    const result = await this.prisma.$transaction(async (tx) => {
      const session = await tx.session.findUnique({
        where: {
          tokenHash_deviceId: {
            tokenHash: refreshTokenHash,
            deviceId,
          },
        },
      });

      if (!session) {
        return { success: false as const };
      }

      if (session.expiresAt <= new Date()) {
        await tx.session.delete({
          where: { id: session.id },
        });
        return { success: false as const };
      }

      const newRefreshToken = crypto.randomBytes(32).toString('hex');

      const newRefreshTokenHash = crypto
        .createHash('sha256')
        .update(newRefreshToken)
        .digest('hex');

      const updated = await tx.session.updateMany({
        where: { id: session.id, tokenHash: refreshTokenHash, deviceId },
        data: {
          tokenHash: newRefreshTokenHash,
        },
      });
      if (updated.count === 0) return { success: false as const };

      await tx.usedRefreshToken.create({
        data: {
          tokenHash: refreshTokenHash,
          sessionId: session.id,
        },
      });
      return { session, newRefreshToken, success: true as const };
    });

    if (!result.success)
      return await this.handleInvalidOrReusedRefreshToken(
        refreshTokenHash,
        deviceId,
      );

    const accessToken = await this.jwtService.signAsync({
      sub: result.session.userId,
    });

    return { accessToken, newRefreshToken: result.newRefreshToken };
  }

  async login(loginDto: LoginDto, deviceId: string | undefined) {
    if (!deviceId) throw new BadRequestException('no device id');

    const user = await this.userService.findUserByIdentifier(
      loginDto.identifier,
    );
    if (!user) throw new UnauthorizedException('invalid credentials');

    const { id: userId, password: hashPassword } = user;

    const validPassword = await this.passwordService.compare(
      loginDto.password,
      hashPassword,
    );

    if (!validPassword) throw new UnauthorizedException('invalid credentials');

    const accessToken = await this.jwtService.signAsync({
      sub: userId,
    });

    const refreshToken = crypto.randomBytes(32).toString('hex');
    const refreshTokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    const refreshTokenExpiresInDays = Number(
      this.config.getOrThrow<string>('REFRESH_TOKEN_EXPIRES_IN_DAYS'),
    );

    const expiresAt = new Date(
      Date.now() + refreshTokenExpiresInDays * 24 * 60 * 60 * 1000,
    );

    const existingSession = await this.prisma.session.findUnique({
      where: {
        userId_deviceId: {
          userId,
          deviceId,
        },
      },
    });

    if (!existingSession) {
      await this.prisma.session.upsert({
        where: {
          userId_deviceId: {
            userId,
            deviceId,
          },
        },
        update: {
          tokenHash: refreshTokenHash,
          expiresAt,
        },
        create: {
          tokenHash: refreshTokenHash,
          deviceId,
          userId,
          expiresAt,
        },
      });
    } else {
      await this.prisma.$transaction([
        this.prisma.usedRefreshToken.deleteMany({
          where: { sessionId: existingSession.id },
        }),
        this.prisma.session.update({
          where: {
            id: existingSession.id,
          },
          data: {
            tokenHash: refreshTokenHash,
            expiresAt,
          },
        }),
      ]);
    }

    return { accessToken, refreshToken };
  }

  async signup(createUserDto: CreateUserDto, deviceId: string | undefined) {
    if (!deviceId) throw new BadRequestException('no device id');
    const { id: userId } = await this.userService.createUser(createUserDto);
    const accessToken = await this.jwtService.signAsync({
      sub: userId,
    });

    const refreshToken = crypto.randomBytes(32).toString('hex');
    const refreshTokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');
    const refreshTokenExpiresInDays = Number(
      this.config.getOrThrow<string>('REFRESH_TOKEN_EXPIRES_IN_DAYS'),
    );
    const expiresAt = new Date(
      Date.now() + refreshTokenExpiresInDays * 24 * 60 * 60 * 1000,
    );
    await this.prisma.session.create({
      data: {
        tokenHash: refreshTokenHash,
        userId,
        deviceId,
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }

  async logoutDevice(userId: string, deviceId: string | undefined) {
    if (!deviceId) throw new BadRequestException('no device id');
    await this.prisma.session.deleteMany({
      where: {
        userId,
        deviceId,
      },
    });
  }

  async logoutAllDevices(userId: string) {
    await this.prisma.session.deleteMany({ where: { userId } });
  }
}
