import { SessionCleanupService } from './clean-session.service.js';
import { PrismaService } from '#prisma/prisma.service.js';
import { describe, expect, it, jest, beforeEach } from '@jest/globals';

describe('SessionCleanupService', () => {
  let service: SessionCleanupService;
  const prisma = {
    session: {
      deleteMany: jest.fn<(value: unknown) => Promise<{ count: number }>>(() =>
        Promise.resolve({ count: 0 }),
      ),
    },
  };

  beforeEach(() => {
    service = new SessionCleanupService(prisma as unknown as PrismaService);
    jest.clearAllMocks();
  });

  describe('cleanupExpiredSessions', () => {
    it('should delete sessions with expiresAt in the past', async () => {
      prisma.session.deleteMany.mockResolvedValue({ count: 3 });

      await service.cleanupExpiredSessions();

      expect(prisma.session.deleteMany).toHaveBeenCalledWith({
        where: {
          expiresAt: {
            lt: expect.any(Date),
          },
        },
      });
    });

    it('should not throw when no expired sessions exist', async () => {
      prisma.session.deleteMany.mockResolvedValue({ count: 0 });

      await expect(service.cleanupExpiredSessions()).resolves.toBeUndefined();
      expect(prisma.session.deleteMany).toHaveBeenCalledTimes(1);
    });
  });
});
