import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from '../../../types/request.js';
import { User } from '../../../generated/client.js';
export const CurrentUser = createParamDecorator(
  (data: keyof User, ctx: ExecutionContext) => {
    const req: Request = ctx.switchToHttp().getRequest();
    if (!data) return req.user;
    return req.user[data];
  },
);
