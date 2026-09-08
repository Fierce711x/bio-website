import { Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserService } from '#user/user.service.js';
import { JwtPayload } from '#auth/types/jwt.js';
import { Request } from '#src/types/request.js';
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly userService: UserService,
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
    const user = await this.userService.findUserById(payload.sub);
    if (!user) throw new UnauthorizedException();
    return {
      id: user.id,
      username: user.username,
      role: user.role,
    };
  }
}
