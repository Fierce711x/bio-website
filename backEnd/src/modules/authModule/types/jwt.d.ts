import { UserRole } from '../../../generated/enums.ts';
export interface JwtPayload {
  sub: string;
  role: UserRole;
}
