import {
  isEmail,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isEmailOrUsername', async: false })
export class IsEmailOrUsername implements ValidatorConstraintInterface {
  validate(value: unknown): Promise<boolean> | boolean {
    if (typeof value !== 'string') return false;
    value.toLowerCase();

    const isValidEmail = isEmail(value);
    const isValidUsername = value.length >= 8 && value.length <= 50;

    return isValidEmail || isValidUsername;
  }

  defaultMessage(): string {
    return 'identifier must be a valid username or email';
  }
}
