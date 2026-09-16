import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from '#src/types/request.js';
import { ConnectionsStorage } from '#src/modules/webSockets/connectionsStroage.service.js';
import { UnauthorizedException } from '@nestjs/common';
@Injectable()
export class ConnectionsGuard implements CanActivate {
  constructor(private readonly connectionsStorage: ConnectionsStorage) {}
  canActivate(ctx: ExecutionContext): boolean {
    const req: Request = ctx.switchToHttp().getRequest();
    const user = req.user;
    const connectionId = req.headers['x-connection-id'];
    if (!user) throw new UnauthorizedException('no user present');
    if (!connectionId)
      throw new UnauthorizedException('no connection id present');
    const isValid = this.connectionsStorage.isActiveSession(
      user.id,
      connectionId,
    );
    if (!isValid)
      throw new UnauthorizedException(
        'user connection id does not match given connection id',
      );
    return true;
  }
}
