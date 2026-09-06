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
import { PasswordService } from '../passwordModule/password.service.js';

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
  let passwordService: PasswordService;
  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    prisma = moduleRef.get(PrismaService);
    jwtService = moduleRef.get(JwtService);
    passwordService = moduleRef.get(PasswordService);
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

  describe('refresh', () => {
    let user: User;
    let deviceId: string;
    let refreshToken: string;
    beforeAll(async () => {
      const hashedPassword = await passwordService.hash(userData.password);

      user = await prisma.user.create({
        data: {
          username: userData.username,
          password: hashedPassword,
          email: userData.email,
          student: {
            create: {
              grade: userData.grade,
              phone: userData.phone,
            },
          },
        },
      });

      deviceId = crypto.randomUUID();
      refreshToken = crypto.randomBytes(32).toString('hex');
      const refreshTokenHash = crypto
        .createHash('sha256')
        .update(refreshToken)
        .digest('hex');

      await prisma.session.create({
        data: {
          userId: user.id,
          deviceId: deviceId,
          tokenHash: refreshTokenHash,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      });
    });

    it('should reject an invalid refresh token without deleting the session', async () => {
      const invalidRefreshToken = crypto.randomBytes(32).toString('hex');

      const response = await request(server)
        .post('/auth/refresh')
        .set('Cookie', [
          `deviceId=${deviceId}`,
          `refreshToken=${invalidRefreshToken}`,
        ]);

      expect(response.status).toBe(401);

      const session = await prisma.session.findUnique({
        where: {
          userId_deviceId: {
            userId: user.id,
            deviceId,
          },
        },
      });
      const refreshTokenHash = crypto
        .createHash('sha256')
        .update(refreshToken)
        .digest('hex');
      expect(session).not.toBeNull();
      expect(session?.tokenHash).toBe(refreshTokenHash);
    });

    it('should refresh the tokens successfully', async () => {
      const authService = moduleRef.get(AuthService);
      const refreshSpy = jest.spyOn(authService, 'refresh');
      const response = await request(server)
        .post('/auth/refresh')
        .set('Cookie', [
          `deviceId=${deviceId}`,
          `refreshToken=${refreshToken}`,
        ]);

      expect(response.status).toBe(200);

      expect(response.body).toEqual({
        message: 'token refreshed successfully',
      });

      expect(response.headers['set-cookie']).toEqual(
        expect.arrayContaining([
          expect.stringContaining('accessToken='),
          expect.stringContaining('refreshToken='),
        ]),
      );

      const { newRefreshToken } = (await refreshSpy.mock.results[0].value) as {
        accessToken: string;
        newRefreshToken: string;
      };
      const newRefreshTokenHash = crypto
        .createHash('sha256')
        .update(newRefreshToken)
        .digest('hex');

      const session = await prisma.session.findUnique({
        where: {
          userId_deviceId: {
            userId: user.id,
            deviceId: deviceId,
          },
        },
      });

      expect(session).not.toBeNull();
      expect(session!.tokenHash).toBe(newRefreshTokenHash);

      const oldRefreshTokenHash = crypto
        .createHash('sha256')
        .update(refreshToken)
        .digest('hex');
      const usedRefreshToken = await prisma.usedRefreshToken.findUnique({
        where: {
          tokenHash: oldRefreshTokenHash,
        },
      });
      expect(usedRefreshToken).not.toBeNull();
      expect(usedRefreshToken?.sessionId).toBe(session?.id);
    });

    it('should reject an expired session and delete it', async () => {
      const expiredDeviceId = crypto.randomUUID();
      const expiredRefreshToken = crypto.randomBytes(32).toString('hex');
      const expiredRefreshTokenHash = crypto
        .createHash('sha256')
        .update(expiredRefreshToken)
        .digest('hex');

      await prisma.session.create({
        data: {
          userId: user.id,
          deviceId: expiredDeviceId,
          tokenHash: expiredRefreshTokenHash,
          expiresAt: new Date(Date.now() - 60 * 60 * 1000),
        },
      });

      const response = await request(server)
        .post('/auth/refresh')
        .set('Cookie', [
          `deviceId=${expiredDeviceId}`,
          `refreshToken=${expiredRefreshToken}`,
        ]);

      expect(response.status).toBe(401);

      const session = await prisma.session.findUnique({
        where: {
          userId_deviceId: {
            userId: user.id,
            deviceId: expiredDeviceId,
          },
        },
      });

      expect(session).toBeNull();
    });

    it('should reject a reused refresh token from a different device without deleting the session', async () => {
      const differentDeviceId = crypto.randomUUID();

      const response = await request(server)
        .post('/auth/refresh')
        .set('Cookie', [
          `deviceId=${differentDeviceId}`,
          `refreshToken=${refreshToken}`,
        ]);

      expect(response.status).toBe(401);

      const session = await prisma.session.findUnique({
        where: {
          userId_deviceId: {
            userId: user.id,
            deviceId,
          },
        },
      });

      expect(session).not.toBeNull();
    });

    it('should reject a reused refresh token and delete the session', async () => {
      const response = await request(server)
        .post('/auth/refresh')
        .set('Cookie', [
          `deviceId=${deviceId}`,
          `refreshToken=${refreshToken}`,
        ]);

      expect(response.status).toBe(401);

      const session = await prisma.session.findUnique({
        where: {
          userId_deviceId: {
            userId: user.id,
            deviceId,
          },
        },
      });

      expect(session).toBeNull();
    });

    it('should handle concurrent refresh requests using the same refresh token', async () => {
      const raceDeviceId = crypto.randomUUID();
      const raceRefreshToken = crypto.randomBytes(32).toString('hex');

      const raceRefreshTokenHash = crypto
        .createHash('sha256')
        .update(raceRefreshToken)
        .digest('hex');

      await prisma.session.create({
        data: {
          userId: user.id,
          deviceId: raceDeviceId,
          tokenHash: raceRefreshTokenHash,
          expiresAt: new Date(Date.now() + 60_000),
        },
      });

      const [response1, response2] = await Promise.all([
        request(server)
          .post('/auth/refresh')
          .set('Cookie', [
            `deviceId=${raceDeviceId}`,
            `refreshToken=${raceRefreshToken}`,
          ]),

        request(server)
          .post('/auth/refresh')
          .set('Cookie', [
            `deviceId=${raceDeviceId}`,
            `refreshToken=${raceRefreshToken}`,
          ]),
      ]);

      expect(
        [response1.status, response2.status].sort((a, b) => a - b),
      ).toEqual([200, 401]);

      const session = await prisma.session.findUnique({
        where: {
          userId_deviceId: {
            userId: user.id,
            deviceId: raceDeviceId,
          },
        },
      });

      expect(session).toBeNull();
    });

    afterAll(async () => {
      await prisma.user.delete({ where: { id: user.id } });
    });
  });

  describe('login', () => {
    let user: User;
    let deviceId: string;
    beforeAll(async () => {
      const hashedPassword = await passwordService.hash(userData.password);
      user = await prisma.user.create({
        data: {
          username: userData.username,
          password: hashedPassword,
          email: userData.email,
          student: {
            create: {
              grade: userData.grade,
              phone: userData.phone,
            },
          },
        },
      });
    });
    it('should login successfully and create a session for a new device', async () => {
      deviceId = crypto.randomUUID();
      const authService = moduleRef.get(AuthService);
      const loginSpy = jest.spyOn(authService, 'login');
      const response = await request(server)
        .post('/auth/login')
        .set('Cookie', [`deviceId=${deviceId}`])
        .send({
          identifier: userData.email,
          password: userData.password,
        });
      expect(response.status).toBe(200);

      expect(response.body).toEqual({
        message: 'Logged in successfully',
      });

      expect(response.headers['set-cookie']).toEqual(
        expect.arrayContaining([
          expect.stringContaining('accessToken='),
          expect.stringContaining('refreshToken='),
        ]),
      );

      const { refreshToken } = (await loginSpy.mock.results[0].value) as {
        accessToken: string;
        refreshToken: string;
      };
      const refreshTokenHash = crypto
        .createHash('sha256')
        .update(refreshToken)
        .digest('hex');

      const session = await prisma.session.findUnique({
        where: {
          userId_deviceId: {
            userId: user.id,
            deviceId,
          },
        },
      });

      expect(session).not.toBeNull();
      expect(session?.userId).toBe(user.id);
      expect(session?.deviceId).toBe(deviceId);
      expect(session?.tokenHash).toEqual(refreshTokenHash);
      loginSpy.mockRestore();
    });
    it('should update the existing session and delete used refresh tokens', async () => {
      const oldSession = await prisma.session.findUnique({
        where: {
          userId_deviceId: {
            userId: user.id,
            deviceId,
          },
        },
      });

      expect(oldSession).not.toBeNull();

      const usedToken = crypto.randomBytes(32).toString('hex');

      await prisma.usedRefreshToken.create({
        data: {
          tokenHash: crypto
            .createHash('sha256')
            .update(usedToken)
            .digest('hex'),
          sessionId: oldSession!.id,
        },
      });

      const authService = moduleRef.get(AuthService);
      const loginSpy = jest.spyOn(authService, 'login');

      const response = await request(server)
        .post('/auth/login')
        .set('Cookie', [`deviceId=${deviceId}`])
        .send({
          identifier: userData.email,
          password: userData.password,
        });

      expect(response.status).toBe(200);

      expect(response.body).toEqual({
        message: 'Logged in successfully',
      });

      const { refreshToken } = (await loginSpy.mock.results[0].value) as {
        accessToken: string;
        refreshToken: string;
      };

      const newTokenHash = crypto
        .createHash('sha256')
        .update(refreshToken)
        .digest('hex');

      const updatedSession = await prisma.session.findUnique({
        where: {
          userId_deviceId: {
            userId: user.id,
            deviceId,
          },
        },
      });

      expect(updatedSession!.id).toBe(oldSession!.id);
      expect(updatedSession!.tokenHash).toBe(newTokenHash);

      const usedRefreshToken = await prisma.usedRefreshToken.findMany({
        where: {
          sessionId: updatedSession!.id,
        },
      });

      expect(usedRefreshToken.length).toBe(0);

      loginSpy.mockRestore();
    });
    it('should successfully handle concurrent logins on the same device', async () => {
      const [response1, response2] = await Promise.all([
        request(server)
          .post('/auth/login')
          .set('Cookie', [`deviceId=${deviceId}`])
          .send({
            identifier: userData.email,
            password: userData.password,
          }),

        request(server)
          .post('/auth/login')
          .set('Cookie', [`deviceId=${deviceId}`])
          .send({
            identifier: userData.email,
            password: userData.password,
          }),
      ]);
      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
    });
    afterAll(async () => {
      await prisma.user.delete({ where: { id: user.id } });
    });
  });

  describe('signup', () => {
    it('should signup a new user', async () => {
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
      const hashedPassword = await passwordService.hash(userData.password);
      user = await prisma.user.create({
        data: {
          username: userData.username,
          password: hashedPassword,
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
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
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
