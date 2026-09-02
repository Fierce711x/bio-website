import { ConfigService } from '@nestjs/config';
import { UserService } from '#user/user.service.js';
import { JwtStrategy } from './jwt.strategy.js';
import { UnauthorizedException } from '@nestjs/common';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  const userService = {
    findUserById: jest.fn<
      (id: string) => Promise<{
        id: string;
        username: string;
        role: string;
      } | null>
    >(),
  };
  const configService = {
    getOrThrow: jest.fn<(name: string) => string>(),
  };

  beforeEach(() => {
    configService.getOrThrow.mockReturnValue('test-secret');
    strategy = new JwtStrategy(
      configService as unknown as ConfigService,
      userService as unknown as UserService,
    );
    jest.clearAllMocks();
  });

  describe('validate', () => {
    it('should return the authenticated user when the user exists', async () => {
      userService.findUserById.mockResolvedValue({
        id: 'user-1',
        username: 'testuser',
        role: 'STUDENT',
      });

      const result = await strategy.validate({
        sub: 'user-1',
        role: 'STUDENT',
      });

      expect(result).toEqual({
        id: 'user-1',
        username: 'testuser',
        role: 'STUDENT',
      });
      expect(userService.findUserById).toHaveBeenCalledWith('user-1');
    });

    it('should throw UnauthorizedException when the user does not exist', async () => {
      userService.findUserById.mockResolvedValue(null);

      await expect(
        strategy.validate({ sub: 'user-1', role: 'STUDENT' }),
      ).rejects.toThrow(UnauthorizedException);
      expect(userService.findUserById).toHaveBeenCalledWith('user-1');
    });
  });
});
