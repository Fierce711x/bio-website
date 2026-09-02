import { setAuthCookies, clearAuthCookies } from './authCookies.js';
import { ConfigService } from '@nestjs/config';
import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import type { Response } from 'express';

describe('authCookies', () => {
  let res: { cookie: jest.Mock; clearCookie: jest.Mock };
  const createConfig = (env: string) => ({
    getOrThrow: jest.fn<(name: string) => string>((name: string) => {
      if (name === 'NODE_ENV') return env;
      if (name === 'ACCESS_TOKEN_EXPIRES_IN_MINUTES') return '15';
      if (name === 'REFRESH_TOKEN_EXPIRES_IN_DAYS') return '7';
      throw new Error(`unexpected config key: ${name}`);
    }),
  });

  beforeEach(() => {
    res = {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    };
  });

  describe('setAuthCookies', () => {
    it('should set accessToken and refreshToken cookies in development', () => {
      const config = createConfig('development');

      setAuthCookies(
        res as unknown as Response,
        config as unknown as ConfigService,
        {
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
        },
      );

      expect(res.cookie).toHaveBeenCalledWith('accessToken', 'access-token', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000,
      });
      expect(res.cookie).toHaveBeenCalledWith('refreshToken', 'refresh-token', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      expect(config.getOrThrow).toHaveBeenCalledWith(
        'ACCESS_TOKEN_EXPIRES_IN_MINUTES',
      );
      expect(config.getOrThrow).toHaveBeenCalledWith(
        'REFRESH_TOKEN_EXPIRES_IN_DAYS',
      );
      expect(config.getOrThrow).toHaveBeenCalledWith('NODE_ENV');
    });

    it('should set secure cookies in production', () => {
      const config = createConfig('production');

      setAuthCookies(
        res as unknown as Response,
        config as unknown as ConfigService,
        {
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
        },
      );

      expect(res.cookie).toHaveBeenCalledWith('accessToken', 'access-token', {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000,
      });
      expect(res.cookie).toHaveBeenCalledWith('refreshToken', 'refresh-token', {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      expect(config.getOrThrow).toHaveBeenCalledWith(
        'ACCESS_TOKEN_EXPIRES_IN_MINUTES',
      );
      expect(config.getOrThrow).toHaveBeenCalledWith(
        'REFRESH_TOKEN_EXPIRES_IN_DAYS',
      );
      expect(config.getOrThrow).toHaveBeenCalledWith('NODE_ENV');
    });
  });

  describe('clearAuthCookies', () => {
    it('should clear accessToken and refreshToken cookies in development', () => {
      const config = createConfig('development');

      clearAuthCookies(
        res as unknown as Response,
        config as unknown as ConfigService,
      );

      expect(res.clearCookie).toHaveBeenCalledWith('accessToken', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
      });
      expect(res.clearCookie).toHaveBeenCalledWith('refreshToken', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
      });
      expect(config.getOrThrow).toHaveBeenCalledWith('NODE_ENV');
    });

    it('should clear cookies with secure flag in production', () => {
      const config = createConfig('production');

      clearAuthCookies(
        res as unknown as Response,
        config as unknown as ConfigService,
      );

      expect(res.clearCookie).toHaveBeenCalledWith(
        'accessToken',
        expect.objectContaining({ secure: true }),
      );
      expect(res.clearCookie).toHaveBeenCalledWith(
        'refreshToken',
        expect.objectContaining({ secure: true }),
      );
      expect(config.getOrThrow).toHaveBeenCalledWith('NODE_ENV');
    });
  });
});
