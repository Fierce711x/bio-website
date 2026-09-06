jest.unstable_mockModule('./utils/authCookies.js', () => ({
  setAuthCookies: jest.fn(),
  clearAuthCookies: jest.fn(),
}));
import { AuthService } from './auth.service.js';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import type { Response } from 'express';
import type { Request } from '#src/types/request.js';
import { LoginDto } from './dto/login.dto.js';
import { CreateUserDto } from '../userModule/dto/createUser.dto.js';
const { setAuthCookies, clearAuthCookies } =
  await import('./utils/authCookies.js');
const { AuthController: AuthControllerClass } =
  await import('./auth.controller.js');
import type { AuthController } from './auth.controller.js';

describe('AuthController', () => {
  let controller: AuthController;
  const authService = {
    refresh: jest.fn<
      (
        refreshToken: string | undefined,
        deviceId: string | undefined,
      ) => Promise<{
        accessToken: string;
        newRefreshToken: string;
      }>
    >(),
    login:
      jest.fn<
        (
          login: LoginDto,
          deviceId: string | undefined,
        ) => Promise<{ accessToken: string; refreshToken: string }>
      >(),
    signup:
      jest.fn<
        (
          login: CreateUserDto,
          deviceId: string | undefined,
        ) => Promise<{ accessToken: string; refreshToken: string }>
      >(),
    logoutDevice:
      jest.fn<
        (
          userId: string | undefined,
          deviceId: string | undefined,
        ) => Promise<void>
      >(),
    logoutAllDevices: jest.fn<(userId: string) => Promise<void>>(),
  };

  const createResponse = () => ({
    cookie: jest.fn(),
    status: jest.fn<(code: number) => void>(function (this: Response) {
      return this;
    }),
    json: jest.fn<(obj: unknown) => void>(function (this: Response) {
      return this;
    }),
    clearCookie: jest.fn(),
  });

  const createRequest = (cookies: Record<string, string>) => {
    return { cookies } as Request;
  };
  const configService = { getOrThrow: jest.fn() };
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthControllerClass],
      providers: [
        { provide: AuthService, useValue: authService },
        {
          provide: ConfigService,
          useValue: configService,
        },
      ],
    }).compile();
    controller = module.get<AuthController>(AuthControllerClass);
    jest.clearAllMocks();
  });

  describe('refresh', () => {
    it('should refresh tokens and set cookies', async () => {
      authService.refresh.mockResolvedValue({
        accessToken: 'new-access',
        newRefreshToken: 'new-refresh',
      });
      const res = createResponse();
      const req = createRequest({
        refreshToken: 'old-refresh',
        deviceId: 'device-1',
      });

      await expect(
        controller.refresh(req, res as unknown as Response),
      ).resolves.toEqual(res);

      expect(authService.refresh).toHaveBeenCalledWith(
        'old-refresh',
        'device-1',
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'token refreshed successfully',
      });
      expect(setAuthCookies).toHaveBeenCalledWith(
        res as unknown as Response,
        configService as unknown as ConfigService,
        {
          accessToken: 'new-access',
          refreshToken: 'new-refresh',
        },
      );
    });
    it('should not refresh and not set cookies when the refresh fails', async () => {
      authService.refresh.mockRejectedValue(new Error());
      const res = createResponse();
      const req = createRequest({
        refreshToken: 'old-refresh',
        deviceId: 'device-1',
      });

      await expect(
        controller.refresh(req, res as unknown as Response),
      ).rejects.toThrow(Error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(setAuthCookies).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should login and set cookies', async () => {
      authService.login.mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
      const res = createResponse();
      const req = createRequest({ deviceId: 'device-1' });

      await expect(
        controller.login(
          { identifier: 'test@gmail.com', password: 'Test1234' },
          req,
          res as unknown as Response,
        ),
      ).resolves.toEqual(res);

      expect(authService.login).toHaveBeenCalledWith(
        { identifier: 'test@gmail.com', password: 'Test1234' },
        'device-1',
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Logged in successfully',
      });
      expect(setAuthCookies).toHaveBeenCalledWith(
        res as unknown as Response,
        configService as unknown as ConfigService,
        {
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
        },
      );
    });
    it('should not login and not set cookies when the login fails', async () => {
      authService.login.mockRejectedValue(new Error());
      const res = createResponse();
      const req = createRequest({
        deviceId: 'device-1',
      });

      await expect(
        controller.login(
          { identifier: 'test@gmail.com', password: 'Test1234' },
          req,
          res as unknown as Response,
        ),
      ).rejects.toThrow(Error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(setAuthCookies).not.toHaveBeenCalled();
    });
  });

  describe('signup', () => {
    it('should signup and set cookies', async () => {
      authService.signup.mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
      const res = createResponse();
      const req = createRequest({ deviceId: 'device-1' });

      await expect(
        controller.signup(
          {
            username: 'testuser',
            email: 'test@gmail.com',
            grade: 'SEC_3',
            phone: '01002265987',
            password: 'Test1234',
          },
          req,
          res as unknown as Response,
        ),
      ).resolves.toEqual(res);

      expect(authService.signup).toHaveBeenCalledWith(
        {
          username: 'testuser',
          email: 'test@gmail.com',
          grade: 'SEC_3',
          phone: '01002265987',
          password: 'Test1234',
        },
        'device-1',
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'signed up successfully',
      });
      expect(setAuthCookies).toHaveBeenCalledWith(
        res as unknown as Response,
        configService as unknown as ConfigService,
        {
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
        },
      );
    });
    it('should not signup and not set cookies when the signup fails', async () => {
      authService.signup.mockRejectedValue(new Error());
      const res = createResponse();
      const req = createRequest({
        deviceId: 'device-1',
      });

      await expect(
        controller.signup(
          {
            username: 'testuser',
            email: 'test@gmail.com',
            grade: 'SEC_3',
            phone: '01002265987',
            password: 'Test1234',
          },
          req,
          res as unknown as Response,
        ),
      ).rejects.toThrow(Error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(setAuthCookies).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should logout from current device and clear cookies', async () => {
      authService.logoutDevice.mockResolvedValue(undefined);
      const res = createResponse();
      const req = createRequest({ deviceId: 'device-1' });

      await controller.logoutCurrentDevice(
        'user-1',
        req,
        res as unknown as Response,
      );

      expect(authService.logoutDevice).toHaveBeenCalledWith(
        'user-1',
        'device-1',
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Logged out successfully',
      });
      expect(clearAuthCookies).toHaveBeenCalledWith(
        res as unknown as Response,
        configService as unknown as ConfigService,
      );
    });

    it('should not logout from current device and not clear cookies when logout fails', async () => {
      authService.logoutDevice.mockRejectedValue(new Error());
      const res = createResponse();
      const req = createRequest({ deviceId: 'device-1' });

      await expect(
        controller.logoutCurrentDevice(
          'user-1',
          req,
          res as unknown as Response,
        ),
      ).rejects.toThrow();
      expect(authService.logoutDevice).toHaveBeenCalledWith(
        'user-1',
        'device-1',
      );
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(clearAuthCookies).not.toHaveBeenCalled();
    });
  });

  describe('logoutDevice', () => {
    it('should logout from a specific device', async () => {
      authService.logoutDevice.mockResolvedValue(undefined);
      const res = createResponse();

      await expect(
        controller.logoutDevice(
          'user-1',
          'device-2',
          res as unknown as Response,
        ),
      ).resolves.toEqual(res);

      expect(authService.logoutDevice).toHaveBeenCalledWith(
        'user-1',
        'device-2',
      );
    });

    it('should not logout from a specific device when logoutDevice fails', async () => {
      authService.logoutDevice.mockRejectedValue(new Error());
      const res = createResponse();

      await expect(
        controller.logoutDevice(
          'user-1',
          'device-2',
          res as unknown as Response,
        ),
      ).rejects.toThrow(Error);

      expect(authService.logoutDevice).toHaveBeenCalledWith(
        'user-1',
        'device-2',
      );
    });
  });

  describe('logoutAllDevices', () => {
    it('should logout from all devices', async () => {
      authService.logoutAllDevices.mockResolvedValue(undefined);
      const res = createResponse();

      await expect(
        controller.logoutAllDevices('user-1', res as unknown as Response),
      ).resolves.toEqual(res);

      expect(authService.logoutAllDevices).toHaveBeenCalledWith('user-1');
    });
    it('should not logout from all device when logoutAllDevices fails', async () => {
      authService.logoutAllDevices.mockRejectedValue(new Error());
      const res = createResponse();

      await expect(
        controller.logoutAllDevices('user-1', res as unknown as Response),
      ).rejects.toThrow(Error);

      expect(authService.logoutAllDevices).toHaveBeenCalledWith('user-1');
    });
  });
});
