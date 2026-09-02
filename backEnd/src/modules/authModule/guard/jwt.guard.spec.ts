import 'dotenv/config';
import { JwtAuthGuard } from './jwt.guard.js';
import { UnauthorizedException } from '@nestjs/common';
import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
describe('JwtAuthGuard', () => {
  const createContext = (response: { clearCookie: jest.Mock }) => {
    return {
      switchToHttp: () => ({
        getResponse: () => response,
      }),
    } as unknown as Parameters<JwtAuthGuard['handleRequest']>[3];
  };
  const env = process.env.NODE_ENV as string;
  const secure = process.env.NODE_ENV === 'production';
  const config = {
    getOrThrow: jest.fn<(value: string) => string>(() => env),
  };

  const guard = new JwtAuthGuard(config as unknown as ConfigService);
  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe('handleRequest', () => {
    it('should clear the accessToken cookie and throw UnauthorizedException when the token is expired', () => {
      const clearCookie = jest.fn();
      const context = createContext({ clearCookie });
      const info = { name: 'TokenExpiredError' } as Error;
      expect(() => guard.handleRequest(null, false, info, context)).toThrow(
        UnauthorizedException,
      );
      expect(clearCookie).toHaveBeenCalledWith('accessToken', {
        httpOnly: true,
        secure,
        sameSite: 'lax',
      });
      expect(config.getOrThrow).toHaveBeenCalledWith('NODE_ENV');
    });

    it('should throw the original error when err is present', () => {
      const context = createContext({ clearCookie: jest.fn() });
      const res = context
        .switchToHttp()
        .getResponse<{ clearCookie: jest.Mock }>();
      const err = new Error('passport error');
      expect(() => guard.handleRequest(err, false, undefined, context)).toThrow(
        err,
      );
      expect(config.getOrThrow).not.toHaveBeenCalled();
      expect(res.clearCookie).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when user is missing and no error', () => {
      const context = createContext({ clearCookie: jest.fn() });
      expect(() =>
        guard.handleRequest(null, false, undefined, context),
      ).toThrow(UnauthorizedException);
      expect(config.getOrThrow).not.toHaveBeenCalled();
    });

    it('should return the user when authentication succeeds', () => {
      const context = createContext({ clearCookie: jest.fn() });
      const user = { id: 'user-1', username: 'testuser', role: 'STUDENT' };
      const result = guard.handleRequest(null, user, undefined, context);
      expect(result).toEqual(user);
      expect(config.getOrThrow).not.toHaveBeenCalled();
    });
  });
});
