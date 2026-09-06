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
import { User } from '#src/generated/client.js';
import { CreateUserDto } from '#user/dto/createUser.dto.js';
import { JwtService } from '@nestjs/jwt';
import crypto from 'node:crypto';

describe('AuthModule Integration', () => {
  const userData: CreateUserDto = {
    username: 'testuser123',
    email: 'test@example.com',
    grade: 'SEC_3',
    phone: '01002265987',
    password: 'Password123',
  };
  let jwtService: JwtService;
  let moduleRef: TestingModule;
  let app: INestApplication<Server>;
  let server: Server;
  let prisma: PrismaService;
  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    prisma = moduleRef.get(PrismaService);
    jwtService = moduleRef.get(JwtService);
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
  describe('logout', () => {
    let user: User;
    const deviceIds: string[] = [];
    let accessToken: string;
    beforeAll(async () => {
      user = await prisma.user.create({
        data: {
          username: userData.username,
          password: userData.password,
          email: userData.email,
          student: {
            create: {
              grade: userData.grade,
              phone: userData.phone,
            },
          },
        },
      });

      accessToken = await jwtService.signAsync({
        sub: user.id,
        role: 'STUDENT',
      });
      const sessionData = [];
      for (let i = 0; i < 4; i++) {
        const deviceId = crypto.randomUUID();
        const refreshToken = crypto.randomBytes(32).toString('hex');
        const refreshTokenHash = crypto
          .createHash('sha256')
          .update(refreshToken)
          .digest('hex');
        deviceIds.push(deviceId);
        sessionData.push({
          userId: user.id,
          deviceId,
          tokenHash: refreshTokenHash,
          expiresAt: new Date(Date.now() + 86_400_000),
        });
      }
      await prisma.session.createManyAndReturn({
        data: sessionData,
      });
    });
    describe('logoutCurrentDevice', () => {
      it('logout a device using its deviceId', async () => {
        const response = await request(server)
          .delete('/auth/logout')
          .set('Cookie', [
            `deviceId=${deviceIds[0]}`,
            `accessToken=${accessToken}`,
            'refreshToken=refresh-1',
          ]);
        expect(response.status).toBe(200);
        expect(response.headers['set-cookie']).toEqual(
          expect.arrayContaining([
            expect.stringContaining('accessToken=;'),
            expect.stringContaining('refreshToken=;'),
          ]),
        );
        const session = await prisma.session.findUnique({
          where: {
            userId_deviceId: {
              userId: user.id,
              deviceId: deviceIds[0],
            },
          },
        });
        const remainingSessions = await prisma.session.count({
          where: {
            userId: user.id,
          },
        });
        expect(session).toBeNull();
        expect(remainingSessions).toBe(3);
      });
    });

    describe('logoutDevice', () => {
      it('should logout a specific device using its deviceId', async () => {
        const response = await request(server)
          .delete(`/auth/logout/${deviceIds[1]}`)
          .set('Cookie', [
            `deviceId=${deviceIds[2]}`,
            `accessToken=${accessToken}`,
          ]);

        expect(response.status).toBe(200);

        expect(response.headers['set-cookie']).toBeUndefined();

        const session = await prisma.session.findUnique({
          where: {
            userId_deviceId: {
              userId: user.id,
              deviceId: deviceIds[1],
            },
          },
        });

        expect(session).toBeNull();

        const remainingSessions = await prisma.session.count({
          where: { userId: user.id },
        });

        expect(remainingSessions).toBe(2);
      });
    });

    describe('logoutAllDevices', () => {
      it('should logout all devices', async () => {
        const response = await request(server)
          .delete('/auth/logout/all')
          .set('Cookie', [
            `deviceId=${deviceIds[2]}`,
            `accessToken=${accessToken}`,
          ]);

        expect(response.status).toBe(200);

        expect(response.headers['set-cookie']).toBeUndefined();

        const remainingSessions = await prisma.session.count({
          where: { userId: user.id },
        });

        expect(remainingSessions).toBe(0);
      });
    });
    afterAll(async () => {
      await prisma.user.delete({ where: { id: user.id } });
    });
  });
  afterAll(async () => {
    await app.close();
  });
});
