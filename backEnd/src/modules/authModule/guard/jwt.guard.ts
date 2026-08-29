import { AuthGuard } from '@nestjs/passport';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Response } from 'express';
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser>(
    err: Error | null,
    user: TUser | false,
    info: Error | undefined,
    context: ExecutionContext,
  ) {
    if (info && info.name === 'TokenExpiredError') {
      const response = context.switchToHttp().getResponse<Response>();
      response.clearCookie('accessToken', {
        httpOnly: true,
        secure: false,
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
