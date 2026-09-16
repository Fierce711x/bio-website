import { Module } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { PasswordModule } from '#password/password.module.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';
import { UserModule } from '#user/user.module.js';
import { SessionCleanupService } from './clean-session.service.js';
import { JwtSharedModule } from '../sharedJwtModule/jwtShared.module.js';
import { GateWay } from '#ws/gateway.module.js';
@Module({
  imports: [JwtSharedModule, PasswordModule, UserModule, GateWay],
  providers: [AuthService, JwtStrategy, SessionCleanupService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
