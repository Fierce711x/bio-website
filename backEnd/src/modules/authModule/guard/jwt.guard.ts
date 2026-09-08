import { AuthGuard } from '@nestjs/passport';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly config: ConfigService) {
    super();
  }
  handleRequest<TUser>(
    err: Error | null,
    user: TUser | false,
    info: Error | undefined,
    context: ExecutionContext,
  ) {
    // console.log(err);
    // console.log(user);
    // console.log(info);
    if (info && info.name === 'TokenExpiredError') {
      const response = context.switchToHttp().getResponse<Response>();
      response.clearCookie('accessToken', {
        httpOnly: true,
        secure: this.config.getOrThrow<string>('NODE_ENV') === 'production',
        sameSite: 'lax',
      });
      throw new UnauthorizedException('Token expired');
    }

    if (err || !user) {
      throw err || new UnauthorizedException();
    }

    return user;
  }
}
