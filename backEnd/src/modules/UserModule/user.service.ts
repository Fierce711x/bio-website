import { Injectable } from '@nestjs/common';

@Injectable()
export class UserService {
  sayHello(): string {
    return 'hello user from userService';
  }
}
