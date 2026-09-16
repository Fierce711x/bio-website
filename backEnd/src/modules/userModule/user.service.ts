import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '#prisma/prisma.service.js';
import { CreateUserDto } from './dto/createUser.dto.js';
import { PasswordService } from '#password/password.service.js';
@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
  ) {}

  sayHello(): string {
    return 'hello user from userService';
  }

  async createUser(data: CreateUserDto) {
    const duplicateUsername = await this.prisma.user.findUnique({
      where: { username: data.username },
    });
    const duplicateEmail = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (duplicateUsername || duplicateEmail)
      throw new BadRequestException('this username/email already exists');

    const hashedPassword = await this.passwordService.hash(data.password);
    const userData = {
      username: data.username,
      email: data.email,
      password: hashedPassword,
    };

    const user = await this.prisma.user.create({
      data: {
        ...userData,
        student: {
          create: {
            phone: data.phone,
            grade: data.grade,
          },
        },
      },
    });
    if (!user) throw new BadRequestException('create user failed');

    return user;
  }

  async findUserByIdentifier(identifier: string) {
    return this.prisma.user.findFirst({
      where: { OR: [{ username: identifier }, { email: identifier }] },
    });
  }

  async findUserById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }
}
