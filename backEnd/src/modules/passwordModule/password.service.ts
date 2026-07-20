import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import bcrypt from 'bcrypt';
@Injectable()
export class PasswordService {
  private readonly saltRounds: number;

  constructor(config: ConfigService) {
    this.saltRounds = Number(config.getOrThrow('SALT_ROUNDS'));
  }

  hash(password: string) {
    return bcrypt.hash(password, this.saltRounds);
  }

  compare(password: string, hash: string) {
    return bcrypt.compare(password, hash);
  }
}
