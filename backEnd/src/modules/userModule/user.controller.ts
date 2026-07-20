import { Controller, Get, Body, Post } from '@nestjs/common';
import { UserService } from './user.service.js';
import { CreateUserDto } from './dto/createUser.dto.js';
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  sayHello(): string {
    return this.userService.sayHello();
  }

  @Post('create')
  async createUser(@Body() createUserDto: CreateUserDto) {
    return await this.userService.createUser(createUserDto);
  }
}
