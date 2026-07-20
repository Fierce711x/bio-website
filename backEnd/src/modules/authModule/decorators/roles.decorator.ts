import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../../generated/enums.js';
export const ROLES = 'ROLES';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES, roles);
