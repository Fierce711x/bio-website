import { Module } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PasswordModule } from '#password/password.module.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';
import { UserModule } from '#user/user.module.js';
import { SessionCleanupService } from './clean-session.service.js';
@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: '15m',
        },
      }),
    }),
    PasswordModule,
    UserModule,
  ],
  providers: [AuthService, JwtStrategy, SessionCleanupService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
