import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from '#src/types/request.js';
import { ROLES } from '#auth/decorators/roles.decorator.js';
import { UserRole } from '#src/generated/enums.js';
import { Reflector } from '@nestjs/core';
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(ctx: ExecutionContext): boolean {
    const req: Request = ctx.switchToHttp().getRequest();
    const user = req.user;

    const roles: UserRole[] | undefined = this.reflector.getAllAndOverride(
      ROLES,
      [ctx.getHandler(), ctx.getClass()],
    );
    if (!roles) return true;
    if (!user || !roles.includes(user.role)) return false;
    return true;
  }
}
