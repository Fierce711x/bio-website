import { IsString, Validate, IsStrongPassword } from 'class-validator';
import { IsEmailOrUsername } from '#auth/decorators/isEmailorUsername.decorator.js';
export class LoginDto {
  @IsString()
  @Validate(IsEmailOrUsername)
  identifier: string;

  @IsString()
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minNumbers: 1,
    minUppercase: 1,
    minSymbols: 0,
  })
  password: string;
}
