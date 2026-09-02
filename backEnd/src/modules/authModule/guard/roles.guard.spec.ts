import { RolesGuard } from './roles.guard.js';
import { Reflector } from '@nestjs/core';
import { UserRole } from '#src/generated/enums.js';
import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import type { ExecutionContext } from '@nestjs/common';
import { ROLES } from '../decorators/roles.decorator.js';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  const reflector = {
    getAllAndOverride:
      jest.fn<(key: string, targets: unknown[]) => UserRole[] | undefined>(),
  };

  const createContext = (user: unknown) => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    guard = new RolesGuard(reflector as unknown as Reflector);
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    it('should allow access when no roles are defined', () => {
      reflector.getAllAndOverride.mockReturnValue(undefined);
      const context = createContext({ id: 'user-1', role: 'STUDENT' });

      expect(guard.canActivate(context)).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES, [
        expect.any(Object),
        expect.any(Object),
      ]);
    });

    it('should deny access when roles are defined but the user is missing', () => {
      reflector.getAllAndOverride.mockReturnValue(['STUDENT']);
      const context = createContext(undefined);

      expect(guard.canActivate(context)).toBe(false);
    });

    it('should deny access when the user role is not in the allowed roles', () => {
      reflector.getAllAndOverride.mockReturnValue(['TEACHER']);
      const context = createContext({ id: 'user-1', role: 'STUDENT' });

      expect(guard.canActivate(context)).toBe(false);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES, [
        expect.any(Object),
        expect.any(Object),
      ]);
    });

    it('should allow access when the user role is in the allowed roles', () => {
      reflector.getAllAndOverride.mockReturnValue(['STUDENT', 'TEACHER']);
      const context = createContext({ id: 'user-1', role: 'STUDENT' });

      expect(guard.canActivate(context)).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES, [
        expect.any(Object),
        expect.any(Object),
      ]);
    });
  });
});
