import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from '#src/types/request.js';
import { AuthenticatedUser } from '#auth/types/user.js';
export const CurrentUser = createParamDecorator(
  (data: keyof AuthenticatedUser, ctx: ExecutionContext) => {
    const req: Request = ctx.switchToHttp().getRequest();
    if (!data) return req.user;
    return req.user[data];
  },
);
