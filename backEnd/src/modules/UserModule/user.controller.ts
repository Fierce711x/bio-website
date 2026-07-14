import { Controller, Get } from '@nestjs/common';
import { UserService } from './user.service.js';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}
  @Get()
  sayHello(): string {
    return this.userService.sayHello();
  }
}
