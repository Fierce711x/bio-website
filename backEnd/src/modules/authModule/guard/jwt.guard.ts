import { AuthGuard } from '@nestjs/passport';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { User } from '../../../generated/client.js';
import { Response } from 'express';
export class JwtAuthGuard extends AuthGuard('jwt') {
  override handleRequest(
    err: any,
    user: any,
    info: any,
    context: ExecutionContext,
  ) {
    // 1. Check if the token is expired
    if (info && info.name === 'TokenExpiredError') {
      const response = context.switchToHttp().getResponse<Response>();

      // 2. Clear the cookie from the response
      response.clearCookie('your_cookie_name', {
        httpOnly: true, // Match the options used when setting the cookie
        secure: true, // Match the options used when setting the cookie
        sameSite: 'strict',
      });

      // 3. Throw the exception so NestJS handles the 401 response
      throw new UnauthorizedException('Token expired. Please log in again.');
    }

    // 4. Handle other general authentication errors
    if (err || !user) {
      throw err || new UnauthorizedException();
    }

    return user;
  }
}
