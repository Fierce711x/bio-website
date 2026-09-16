import { UserRole } from '#src/generated/enums.ts';
export interface JwtPayload {
  sub: string;
  sessionId: string;
  role: UserRole;
}
