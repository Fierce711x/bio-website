import { DeviceIdMiddleware } from './deviceId.middleware.js';
import { ConfigService } from '@nestjs/config';
import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import type { Response } from 'express';
import type { Request } from '#src/types/request.js';
describe('DeviceIdMiddleware', () => {
  let middleware: DeviceIdMiddleware;
  let req: { cookies: Record<string, string | undefined> };
  let res: { cookie: jest.Mock };
  let next: () => void;
  const config = {
    getOrThrow: jest.fn<(name: string) => string>(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    middleware = new DeviceIdMiddleware(config as unknown as ConfigService);
    req = { cookies: {} };
    res = { cookie: jest.fn() };
    next = jest.fn();
  });

  it('should generate a deviceId and set it as a cookie when missing', () => {
    middleware.use(req as unknown as Request, res as unknown as Response, next);

    expect(res.cookie).toHaveBeenCalledWith(
      'deviceId',
      expect.any(String),
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
      }),
    );
    const cookieCall = res.cookie.mock.calls[0];
    const deviceIdCookie = cookieCall[1];
    expect(req.cookies.deviceId).toBe(deviceIdCookie);
    expect(next).toHaveBeenCalled();
  });

  it('should generate a deviceId and set it as a cookie when the deviceId is not a UUID', () => {
    req.cookies.deviceId = 'device-1';

    middleware.use(req as unknown as Request, res as unknown as Response, next);

    expect(res.cookie).toHaveBeenCalledWith(
      'deviceId',
      expect.any(String),
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
      }),
    );
    const cookieCall = res.cookie.mock.calls[0];
    const deviceIdCookie = cookieCall[1];
    expect(req.cookies.deviceId).toEqual(deviceIdCookie);
    expect(next).toHaveBeenCalled();
  });

  it('should set secure flag in production', () => {
    config.getOrThrow.mockReturnValue('production');

    middleware.use(req as unknown as Request, res as unknown as Response, next);

    expect(res.cookie).toHaveBeenCalledWith(
      'deviceId',
      expect.any(String),
      expect.objectContaining({ secure: true }),
    );
  });

  it('should not set secure flag in development', () => {
    config.getOrThrow.mockReturnValue('development');

    middleware.use(req as unknown as Request, res as unknown as Response, next);

    expect(res.cookie).toHaveBeenCalledWith(
      'deviceId',
      expect.any(String),
      expect.objectContaining({ secure: false }),
    );
  });

  it('should preserve an existing deviceId cookie', () => {
    req.cookies.deviceId = 'badfc7a2-b2d2-4d8e-877d-39d6f65cb8e0';

    middleware.use(req as unknown as Request, res as unknown as Response, next);

    expect(res.cookie).not.toHaveBeenCalled();
    expect(req.cookies.deviceId).toBe('badfc7a2-b2d2-4d8e-877d-39d6f65cb8e0');
    expect(next).toHaveBeenCalled();
  });
});
