import {
  IsString,
  IsPhoneNumber,
  MinLength,
  MaxLength,
  IsEnum,
  IsStrongPassword,
} from 'class-validator';
import { Transform } from 'class-transformer';
enum Year {
  SEC_1 = 'sec_1',
  SEC_2 = 'sec_2',
  SEC_3 = 'sec_3',
}
export class CreateUserDto {
  @IsString()
  @MinLength(6)
  @MaxLength(50)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toLowerCase() : value,
  )
  username: string;

  @IsEnum(Year)
  year: Year;

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
