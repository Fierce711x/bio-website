import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import type { Response, NextFunction } from 'express';
import type { Request } from '#src/types/request.js';
@Injectable()
export class DeviceIdMiddleware implements NestMiddleware {
  constructor(private readonly config: ConfigService) {}
  use(req: Request, res: Response, next: NextFunction) {
    const regex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const deviceId = req.cookies.deviceId;
    if (!deviceId || !(typeof deviceId === 'string' && regex.test(deviceId))) {
      const deviceId = randomUUID();
      res.cookie('deviceId', deviceId, {
        httpOnly: true,
        secure: this.config.getOrThrow('NODE_ENV') === 'production',
        sameSite: 'lax',
      });
      req.cookies.deviceId = deviceId;
    }
    next();
  }
}
