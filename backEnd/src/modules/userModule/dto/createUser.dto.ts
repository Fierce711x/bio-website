import {
  IsString,
  IsPhoneNumber,
  MinLength,
  MaxLength,
  IsEnum,
  IsStrongPassword,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { StudentYear } from '../../../generated/enums.js';
export class CreateUserDto {
  @IsString()
  @MinLength(8)
  @MaxLength(50)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toLowerCase() : value,
  )
  username: string;

  @IsEnum(StudentYear)
  year: StudentYear;

  @IsPhoneNumber('EG')
  phone: string;

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
