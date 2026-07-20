import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prismaModule/prisma.service.js';
import { CreateUserDto } from './dto/createUser.dto.js';
import { PasswordService } from '../passwordModule/password.service.js';
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
    if (duplicateUsername)
      throw new BadRequestException('this username already exists');

    const hashedPassword = await this.passwordService.hash(data.password);
    const userData = { ...data, password: hashedPassword };

    const user = await this.prisma.user.create({ data: userData });
    if (!user) throw new BadRequestException('create user failed');
    return user;
  }

  async findUserByUsername(username: string) {
    return this.prisma.user.findUnique({ where: { username } });
  }

  async findUserById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }
}
