import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { UserModule } from './modules/userModule/user.module.js';
import { PrismaModule } from './modules/prismaModule/prisma.module.js';
import { ConfigModule } from '@nestjs/config';
import { PasswordModule } from './modules/passwordModule/password.module.js';
import { AuthModule } from './modules/authModule/auth.module.js';
import { ScheduleModule } from '@nestjs/schedule';
import { DeviceIdMiddleware } from './middleware/deviceId.middleware.js';
import { AuthController } from './modules/authModule/auth.controller.js';
@Module({
  imports: [
    UserModule,
    PrismaModule,
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    PasswordModule,
    AuthModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(DeviceIdMiddleware).forRoutes(AuthController);
  }
}
