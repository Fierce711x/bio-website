import { AppModule } from '#src/app.module.js';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import {
  ValidationPipe,
  BadRequestException,
  INestApplication,
} from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { describe, afterAll, it, expect, jest, beforeAll } from '@jest/globals';
import type { Server } from 'node:http';
import { PrismaService } from '#prisma/prisma.service.js';
import { AuthService } from './auth.service.js';
import { ErrorResponse } from '#src/types/response.js';
import { CreateUserDto } from '#user/dto/createUser.dto.js';

describe('AuthModule Integration', () => {
  const userData: CreateUserDto = {
    username: 'testuser123',
    email: 'test@example.com',
    grade: 'SEC_3',
    phone: '01002265987',
    password: 'Password123',
  };
  let moduleRef: TestingModule;
  let app: INestApplication<Server>;
  let server: Server;
  let prisma: PrismaService;
  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    prisma = moduleRef.get(PrismaService);
    app = moduleRef.createNestApplication();
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
    app.use(cookieParser());
    await app.init();
    server = app.getHttpServer();
  });

  describe('signup', () => {
    it('should singup a new user', async () => {
      const response = await request(server)
        .post('/auth/signup')
        .send(userData);
      expect(response.status).toBe(201);
    });
    it('should reject with duplicate username or email', async () => {
      const response = await request(server)
        .post('/auth/signup')
        .send(userData);
      expect(response.status).toBe(400);
    });
    it('should reject invalid signup data before creating the user', async () => {
      const authService = moduleRef.get(AuthService);
      const signupSpy = jest.spyOn(authService, 'signup');
      const response = await request(server).post('/auth/signup').send({
        username: 'short',
        email: 'invalid-email',
        grade: 'INVALID_GRADE',
        phone: '12345',
        password: 'weak',
      });

      const body = response.body as ErrorResponse;
      expect(response.status).toBe(400);
      expect(body.statusCode).toBe(400);
      expect(body.message).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            property: expect.any(String),
            reason: expect.any(Array),
          }),
        ]),
      );
      expect(signupSpy).not.toHaveBeenCalled();
      signupSpy.mockRestore();
    });
    afterAll(async () => {
      await prisma.user.delete({ where: { email: userData.email } });
    });
  });
  afterAll(async () => {
    await app.close();
  });
});
