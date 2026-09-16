import { Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserService } from '#user/user.service.js';
import { JwtPayload } from '#auth/types/jwt.js';
import { Request } from '#src/types/request.js';
import { PrismaService } from '#src/modules/prismaModule/prisma.service.js';
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: (req: Request) => {
        return req.cookies.accessToken ?? null;
      },
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
      ignoreExpiration: false,
    });
  }

  async validate(payload: JwtPayload) {
    const session = await this.prisma.session.findUnique({
      where: { id: payload.sessionId },
      include: {
        user: true,
      },
    });
    if (!session || payload.sub !== session.userId)
      throw new UnauthorizedException();
    return {
      id: session.user.id,
      username: session.user.username,
      role: session.user.role,
    };
  }
}
