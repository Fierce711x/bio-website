import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import type { Request, Response, NextFunction } from 'express';

@Injectable()
export class DeviceIdMiddleware implements NestMiddleware {
  constructor(private readonly config: ConfigService) {}
  use(req: Request, res: Response, next: NextFunction) {
    if (!req.cookies.deviceId) {
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
