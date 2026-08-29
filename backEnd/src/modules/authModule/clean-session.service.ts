import { Injectable, Logger } from '@nestjs/common';
import { CronExpression, Cron } from '@nestjs/schedule';
import { PrismaService } from '#prisma/prisma.service.js';
@Injectable()
export class SessionCleanupService {
  private readonly logger = new Logger(SessionCleanupService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredSessions() {
    const result = await this.prisma.session.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
    if (result.count > 0) {
      this.logger.log(`Deleted ${result.count} expired sessions`);
    }
  }
}
