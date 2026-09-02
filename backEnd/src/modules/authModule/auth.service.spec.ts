import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '#user/user.service.js';
import { PasswordService } from '#password/password.service.js';
import { AuthService } from './auth.service.js';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '#prisma/prisma.service.js';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import type { Session, usedRefreshToken, User } from '#src/generated/client.js';
import { CreateUserDto } from '../userModule/dto/createUser.dto.js';
import { LoginDto } from './dto/login.dto.js';

describe('AuthService', () => {
  let service: AuthService;
  const mockSession: Session = {
    id: 'session-1',
    tokenHash: 'refreshToken-hash',
    userId: 'user-1',
    deviceId: 'device-1',
    createdAt: new Date(),
    expiresAt: new Date(),
  };
  const mockUsedRefreshToken: usedRefreshToken & { session: Session } = {
    id: 'usedRefresh-1',
    tokenHash: 'refreshToken-hash',
    sessionId: 'session-1',
    createdAt: new Date(),
    session: mockSession,
  };
  const mockLoginData: LoginDto = {
    identifier: 'test@gmail.com',
    password: 'password',
  };
  const mockSignupData: CreateUserDto = {
    username: 'username',
    email: 'test@gmail.com',
    grade: 'SEC_3' as const,
    phone: '01002265987',
    password: 'password',
  };
  const prisma = {
    $transaction: jest.fn(
      (arg: ((prisma: unknown) => unknown) | Promise<unknown>[]) => {
        if (typeof arg === 'function') {
          return arg(prisma);
        }
        return Promise.all(arg);
      },
    ),
    session: {
      create:
        jest.fn<
          (obj: { data: Omit<Session, 'id' | 'createdAt'> }) => Promise<Session>
        >(),
      delete:
        jest.fn<
          (obj: { where: { id: string } }) => Promise<{ count: number }>
        >(),
      deleteMany: jest.fn<(value: unknown) => Promise<{ count: number }>>(() =>
        Promise.resolve({ count: 1 }),
      ),
      findUnique:
        jest.fn<
          (obj: {
            where: { userId_deviceId: { userId: string; deviceId: string } };
          }) => Promise<Session | null>
        >(),
      upsert: jest.fn<
        (obj: {
          where: {
            userId_deviceId: {
              userId: string;
              deviceId: string;
            };
          };
          update: {
            tokenHash: string;
            expiresAt: Date;
          };
          create: {
            tokenHash: string;
            deviceId: string;
            userId: string;
            expiresAt: Date;
          };
        }) => Promise<Session | null>
      >(() => Promise.resolve(mockSession)),
      update: jest.fn<
        (obj: {
          where: {
            id: string;
          };
          data: {
            tokenHash: string;
            expiresAt: Date;
          };
        }) => Promise<Session>
      >(() => Promise.resolve(mockSession)),
      updateMany: jest.fn<(value: unknown) => Promise<{ count: number }>>(() =>
        Promise.resolve({ count: 1 }),
      ),
    },
    usedRefreshToken: {
      create: jest.fn<(value: unknown) => Promise<usedRefreshToken>>(),
      deleteMany: jest.fn<(value: unknown) => Promise<{ count: number }>>(() =>
        Promise.resolve({ count: 1 }),
      ),
      findUnique:
        jest.fn<
          (obj: {
            where: { userId_deviceId: { userId: string; deviceId: string } };
          }) => Promise<(usedRefreshToken & { session: Session }) | null>
        >(),
    },
  };
  const userService = {
    findUserByIdentifier:
      jest.fn<
        (identifier: string) => Promise<null | { id: string; password: string }>
      >(),
    createUser: jest.fn<(data: typeof mockSignupData) => Promise<User>>(),
  };
  const passwordService = {
    compare: jest.fn<(password: string, hash: string) => Promise<boolean>>(),
  };
  const jwtService = {
    signAsync: jest.fn<(obj: { sub: string }) => Promise<string>>(),
  };
  const configService = {
    getOrThrow: jest.fn<(name: string) => string>(),
  };
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: ConfigService,
          useValue: configService,
        },

        {
          provide: JwtService,
          useValue: jwtService,
        },

        {
          provide: PasswordService,
          useValue: passwordService,
        },

        {
          provide: UserService,
          useValue: userService,
        },

        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();
    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('refresh', () => {
    it('should throw bad request exeption if device id is missing', async () => {
      await expect(service.refresh('refresh-token', undefined)).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
    it('should throw unauthorized exception if refresh token is missing', async () => {
      await expect(service.refresh(undefined, 'device-1')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
    it('should throw unauthorized exception if session is not found', async () => {
      prisma.session.findUnique.mockResolvedValue(null);
      prisma.usedRefreshToken.findUnique.mockResolvedValue(null);
      await expect(
        service.refresh('refresh-token', 'device-1'),
      ).rejects.toThrow(UnauthorizedException);
      expect(prisma.session.updateMany).not.toHaveBeenCalled();
    });
    it('should throw unauthorized exception if session is expired', async () => {
      prisma.session.findUnique.mockResolvedValue(mockSession);
      prisma.usedRefreshToken.findUnique.mockResolvedValue(null);
      await expect(
        service.refresh('refresh-token', 'device-1'),
      ).rejects.toThrow(UnauthorizedException);
      expect(prisma.session.delete).toHaveBeenCalledWith({
        where: { id: 'session-1' },
      });
      expect(prisma.session.updateMany).not.toHaveBeenCalled();
    });
    it('should throw unauthorized exception when trying to update the session with an old refresh token', async () => {
      prisma.session.findUnique.mockResolvedValue({
        ...mockSession,
        expiresAt: new Date(Date.now() + '60000'),
      });
      prisma.usedRefreshToken.findUnique.mockResolvedValue(
        mockUsedRefreshToken,
      );
      prisma.session.updateMany.mockResolvedValue({ count: 0 });
      await expect(
        service.refresh('refresh-token', 'device-1'),
      ).rejects.toThrow(UnauthorizedException);
      expect(prisma.session.delete).toHaveBeenCalledWith({
        where: { id: 'session-1' },
      });
      expect(prisma.session.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'session-1',
          tokenHash: expect.any(String),
          deviceId: 'device-1',
        },
        data: {
          tokenHash: expect.any(String),
        },
      });
      expect(prisma.usedRefreshToken.create).not.toHaveBeenCalled();
    });
    it('should not delete the session when a reused token is presented from a different device', async () => {
      prisma.session.findUnique.mockResolvedValue({
        ...mockSession,
        expiresAt: new Date(Date.now() + 60000),
      });
      prisma.usedRefreshToken.findUnique.mockResolvedValue({
        ...mockUsedRefreshToken,
        session: { ...mockSession, deviceId: 'device-2' },
      });
      prisma.session.updateMany.mockResolvedValue({ count: 0 });
      await expect(
        service.refresh('refresh-token', 'device-1'),
      ).rejects.toThrow(UnauthorizedException);
      expect(prisma.session.delete).not.toHaveBeenCalled();
    });
    it('should successfully update the session and add old refresh token to used refresh tokens', async () => {
      prisma.session.findUnique.mockResolvedValue({
        ...mockSession,
        expiresAt: new Date(Date.now() + 60000),
      });
      prisma.session.updateMany.mockResolvedValue({ count: 1 });
      jwtService.signAsync.mockResolvedValue('access-token');
      await expect(
        service.refresh('refresh-token', 'device-1'),
      ).resolves.toEqual({
        accessToken: 'access-token',
        newRefreshToken: expect.any(String),
      });
      expect(prisma.session.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'session-1',
          tokenHash: expect.any(String),
          deviceId: 'device-1',
        },
        data: {
          tokenHash: expect.any(String),
        },
      });
      expect(prisma.usedRefreshToken.create).toHaveBeenCalledWith({
        data: {
          tokenHash: expect.any(String),
          sessionId: 'session-1',
        },
      });
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: 'user-1',
      });
    });
  });

  describe('handleInvalidOrReusedRefreshToken', () => {
    it('should delete the session and throw unauthorized when the used token belongs to the same device', async () => {
      prisma.usedRefreshToken.findUnique.mockResolvedValue(
        mockUsedRefreshToken,
      );
      await expect(
        service.handleInvalidOrReusedRefreshToken(
          'refreshToken-hash',
          'device-1',
        ),
      ).rejects.toThrow(UnauthorizedException);
      expect(prisma.session.delete).toHaveBeenCalledWith({
        where: { id: 'session-1' },
      });
    });

    it('should not delete the session when the used token belongs to a different device', async () => {
      prisma.usedRefreshToken.findUnique.mockResolvedValue({
        ...mockUsedRefreshToken,
        session: { ...mockSession, deviceId: 'device-2' },
      });
      await expect(
        service.handleInvalidOrReusedRefreshToken(
          'refreshToken-hash',
          'device-1',
        ),
      ).rejects.toThrow(UnauthorizedException);
      expect(prisma.session.delete).not.toHaveBeenCalled();
    });

    it('should not delete the session when the token is not a used refresh token', async () => {
      prisma.usedRefreshToken.findUnique.mockResolvedValue(null);
      await expect(
        service.handleInvalidOrReusedRefreshToken(
          'refreshToken-hash',
          'device-1',
        ),
      ).rejects.toThrow(UnauthorizedException);
      expect(prisma.session.delete).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should throw bad request exeption if device id is missing', async () => {
      await expect(service.login(mockLoginData, undefined)).rejects.toThrow(
        BadRequestException,
      );
      expect(userService.findUserByIdentifier).not.toHaveBeenCalled();
    });
    it('should throw unauthorizedException if the user does not exist', async () => {
      userService.findUserByIdentifier.mockResolvedValue(null);
      await expect(service.login(mockLoginData, 'device-1')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(userService.findUserByIdentifier).toHaveBeenCalledWith(
        'test@gmail.com',
      );
      expect(passwordService.compare).not.toHaveBeenCalled();
    });
    it('should throw unauthorizedException if the passwords does not match', async () => {
      userService.findUserByIdentifier.mockResolvedValue({
        id: 'user-id',
        password: 'hashed-password',
      });
      passwordService.compare.mockResolvedValue(false);
      await expect(service.login(mockLoginData, 'device-1')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(userService.findUserByIdentifier).toHaveBeenCalledWith(
        'test@gmail.com',
      );
      expect(passwordService.compare).toHaveBeenCalledWith(
        'password',
        'hashed-password',
      );
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });
    it('should create a new session if no session exists', async () => {
      userService.findUserByIdentifier.mockResolvedValue({
        id: 'user-1',
        password: 'hashed-password',
      });
      passwordService.compare.mockResolvedValue(true);
      jwtService.signAsync.mockResolvedValue('access-token');
      configService.getOrThrow.mockReturnValue('15');
      prisma.session.findUnique.mockResolvedValue(null);
      await expect(service.login(mockLoginData, 'device-1')).resolves.toEqual({
        accessToken: 'access-token',
        refreshToken: expect.any(String),
      });
      expect(userService.findUserByIdentifier).toHaveBeenCalledWith(
        'test@gmail.com',
      );
      expect(passwordService.compare).toHaveBeenCalledWith(
        'password',
        'hashed-password',
      );
      expect(jwtService.signAsync).toHaveBeenCalledWith({ sub: 'user-1' });
      expect(prisma.session.findUnique).toHaveBeenCalledWith({
        where: {
          userId_deviceId: {
            userId: 'user-1',
            deviceId: 'device-1',
          },
        },
      });
      expect(prisma.session.upsert).toHaveBeenCalledWith({
        where: {
          userId_deviceId: {
            userId: 'user-1',
            deviceId: 'device-1',
          },
        },
        update: {
          tokenHash: expect.any(String),
          expiresAt: expect.any(Date),
        },
        create: {
          tokenHash: expect.any(String),
          deviceId: 'device-1',
          userId: 'user-1',
          expiresAt: expect.any(Date),
        },
      });
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
    it('should update the exisiting sesion with the new refersh token hash', async () => {
      userService.findUserByIdentifier.mockResolvedValue({
        id: 'user-1',
        password: 'hashed-password',
      });
      passwordService.compare.mockResolvedValue(true);
      jwtService.signAsync.mockResolvedValue('access-token');
      configService.getOrThrow.mockReturnValue('15');
      prisma.session.findUnique.mockResolvedValue(mockSession);
      await expect(service.login(mockLoginData, 'device-1')).resolves.toEqual({
        accessToken: 'access-token',
        refreshToken: expect.any(String),
      });
      expect(userService.findUserByIdentifier).toHaveBeenCalledWith(
        'test@gmail.com',
      );
      expect(passwordService.compare).toHaveBeenCalledWith(
        'password',
        'hashed-password',
      );
      expect(jwtService.signAsync).toHaveBeenCalledWith({ sub: 'user-1' });
      expect(prisma.session.findUnique).toHaveBeenCalledWith({
        where: {
          userId_deviceId: {
            userId: 'user-1',
            deviceId: 'device-1',
          },
        },
      });
      expect(prisma.session.upsert).not.toHaveBeenCalled();
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(prisma.usedRefreshToken.deleteMany).toHaveBeenCalledWith({
        where: { sessionId: 'session-1' },
      });
      expect(prisma.session.update).toHaveBeenCalledWith({
        where: {
          id: 'session-1',
        },
        data: {
          tokenHash: expect.any(String),
          expiresAt: expect.any(Date),
        },
      });
    });
    it('should throw when REFRESH_TOKEN_EXPIRES_IN_DAYS config is missing', async () => {
      userService.findUserByIdentifier.mockResolvedValue({
        id: 'user-1',
        password: 'hashed-password',
      });
      passwordService.compare.mockResolvedValue(true);
      jwtService.signAsync.mockResolvedValue('access-token');
      configService.getOrThrow.mockImplementation(() => {
        throw new Error('REFRESH_TOKEN_EXPIRES_IN_DAYS not found');
      });
      await expect(service.login(mockLoginData, 'device-1')).rejects.toThrow(
        Error,
      );
      expect(prisma.session.findUnique).not.toHaveBeenCalled();
      configService.getOrThrow.mockReset();
    });
  });

  describe('signup', () => {
    it('should throw bad request exeption if device id is missing', async () => {
      await expect(service.signup(mockSignupData, undefined)).rejects.toThrow(
        BadRequestException,
      );
      expect(userService.createUser).not.toHaveBeenCalled();
    });

    it('throw an error if userService user creation fails', async () => {
      userService.createUser.mockRejectedValue(
        new Error('user creation failed'),
      );
      await expect(service.signup(mockSignupData, 'device-1')).rejects.toThrow(
        Error,
      );
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });

    it('throw an error if prisma session creation fails', async () => {
      userService.createUser.mockResolvedValue({
        id: 'user-1',
        username: 'username',
        email: 'test@gmail.com',
        password: 'password',
        createdAt: new Date(),
        role: 'STUDENT',
      });
      jwtService.signAsync.mockResolvedValue('access-token');
      configService.getOrThrow.mockReturnValue('7');
      prisma.session.create.mockRejectedValue(new Error('database failed'));
      await expect(service.signup(mockSignupData, 'device-1')).rejects.toThrow(
        Error,
      );
      expect(userService.createUser).toHaveBeenCalledWith({
        username: 'username',
        email: 'test@gmail.com',
        password: 'password',
        phone: '01002265987',
        grade: 'SEC_3',
      });
      expect(jwtService.signAsync).toHaveBeenCalledWith({ sub: 'user-1' });
    });
    it('should throw when REFRESH_TOKEN_EXPIRES_IN_DAYS config is missing', async () => {
      userService.createUser.mockResolvedValue({
        id: 'user-1',
        username: 'username',
        email: 'test@gmail.com',
        password: 'password',
        createdAt: new Date(),
        role: 'STUDENT',
      });
      jwtService.signAsync.mockResolvedValue('access-token');
      configService.getOrThrow.mockImplementation(() => {
        throw new Error('REFRESH_TOKEN_EXPIRES_IN_DAYS not found');
      });
      await expect(service.signup(mockSignupData, 'device-1')).rejects.toThrow(
        Error,
      );
      expect(prisma.session.create).not.toHaveBeenCalled();
      configService.getOrThrow.mockReset();
    });

    it('creates a user and a session and signups the user', async () => {
      userService.createUser.mockResolvedValue({
        id: 'user-1',
        username: 'username',
        email: 'test@gmail.com',
        password: 'password',
        createdAt: new Date(),
        role: 'STUDENT',
      });
      prisma.session.create.mockResolvedValue(mockSession);
      jwtService.signAsync.mockResolvedValue('access-token');
      configService.getOrThrow.mockReturnValue('7');
      await expect(service.signup(mockSignupData, 'device-1')).resolves.toEqual(
        {
          accessToken: 'access-token',
          refreshToken: expect.any(String),
        },
      );
      expect(userService.createUser).toHaveBeenCalledWith({
        username: 'username',
        email: 'test@gmail.com',
        password: 'password',
        phone: '01002265987',
        grade: 'SEC_3',
      });
      expect(jwtService.signAsync).toHaveBeenCalledWith({ sub: 'user-1' });
      expect(prisma.session.create).toHaveBeenCalledWith({
        data: {
          tokenHash: expect.any(String),
          userId: 'user-1',
          deviceId: 'device-1',
          expiresAt: expect.any(Date),
        },
      });
    });
  });

  describe('logoutDevice', () => {
    it('should throw bad request exeption if device id is missing', async () => {
      await expect(service.logoutDevice('user-1', undefined)).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.session.deleteMany).not.toHaveBeenCalled();
    });

    it('should delete the session with the userId and deviceId', async () => {
      await service.logoutDevice('user-1', 'device-1');
      expect(prisma.session.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', deviceId: 'device-1' },
      });
    });
  });

  describe('logoutAllDevices', () => {
    it('should delete all the sessions with the userId', async () => {
      await service.logoutAllDevices('user-1');
      expect(prisma.session.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
    });
  });
});
