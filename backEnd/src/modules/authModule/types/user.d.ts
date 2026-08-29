import { User } from '#src/generated/client.ts';

export type AuthenticatedUser = Pick<User, 'id' | 'username' | 'role'>;
