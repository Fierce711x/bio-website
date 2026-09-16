import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { WsAdapter } from '@nestjs/platform-ws';
import { GlobalExceptionFilter } from './filters/globalException.filter.js';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      exceptionFactory: (errors) => {
        const formatedErrors = errors.map((error) => ({
          property: error.property,
          reason: Object.values(error.constraints ?? {}),
        }));
        return new BadRequestException(formatedErrors);
      },
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useWebSocketAdapter(new WsAdapter(app));
  app.use(cookieParser());
  app.enableCors({
    origin: 'http://localhost:5173',
    // origin: 'http://192.168.1.23:5173',
    credentials: true,
  });
  app.enableShutdownHooks();
  await app.listen(process.env.PORT ?? 3000);
  // await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
