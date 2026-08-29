import {
  IsString,
  IsPhoneNumber,
  MinLength,
  MaxLength,
  IsEnum,
  IsStrongPassword,
  IsEmail,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { StudentGrade } from '#src/generated/enums.js';
export class CreateUserDto {
  @IsString()
  @MinLength(8)
  @MaxLength(50)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toLowerCase() : value,
  )
  username: string;

  @IsEmail()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toLowerCase() : value,
  )
  email: string;

  @IsEnum(StudentGrade)
  grade: StudentGrade;

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
