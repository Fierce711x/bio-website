import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from '#src/types/request.js';
import { AuthenticatedUser } from '#auth/types/user.js';
export const CurrentUser = createParamDecorator(
  (data: keyof AuthenticatedUser, ctx: ExecutionContext) => {
    const req: Request = ctx.switchToHttp().getRequest();
    const user = req.user;
    if (!user) throw new UnauthorizedException('no user present');
    if (!data) return req.user;
    return user[data];
  },
);
