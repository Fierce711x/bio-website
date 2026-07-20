import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PasswordService } from '../passwordModule/password.service.js';
import { UserService } from '../userModule/user.service.js';
import { LoginDto } from './dto/login.dto.js';
import { CreateUserDto } from '../userModule/dto/createUser.dto.js';
@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly passwordService: PasswordService,
    private readonly userService: UserService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.userService.findUserByUsername(loginDto.username);
    if (!user) throw new UnauthorizedException('invalid credentials');
    const { id, password: hashPassword } = user;

    const valid = await this.passwordService.compare(
      loginDto.password,
      hashPassword,
    );

    if (!valid) throw new UnauthorizedException('invalid credentials');

    const payload = {
      sub: id,
    };
    return this.jwtService.sign(payload);
  }

  async signup(createUserDto: CreateUserDto) {
    const { id } = await this.userService.createUser(createUserDto);
    const payload = {
      sub: id,
    };
    return this.jwtService.sign(payload);
  }
}
