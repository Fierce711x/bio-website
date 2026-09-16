import { Request as ExpressRequest } from 'express';
import { AuthenticatedUser } from '#auth/types/user.js';
export interface Request extends ExpressRequest {
  cookies: {
    deviceId: string | undefined;
    refreshToken: string | undefined;
    accessToken: string | undefined;
  };
  user: AuthenticatedUser | undefined;
  headers: {
    'x-connection-id': string | undefined;
  };
}
