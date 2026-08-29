import type { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export function setAuthCookies(
  res: Response,
  config: ConfigService,
  { accessToken, refreshToken }: AuthTokens,
) {
  const secure = config.getOrThrow<string>('NODE_ENV') === 'production';
  const accessTokenExpireInMinutes = Number(
    config.getOrThrow<string>('ACCESS_TOKEN_EXPIRES_IN_MINUTES'),
  );
  const refreshTokenExpireInDays = Number(
    config.getOrThrow<string>('REFRESH_TOKEN_EXPIRES_IN_DAYS'),
  );

  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    maxAge: accessTokenExpireInMinutes * 60 * 1000,
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    maxAge: refreshTokenExpireInDays * 24 * 60 * 60 * 1000,
  });
}

export function clearAuthCookies(res: Response, config: ConfigService) {
  const secure = config.getOrThrow<string>('NODE_ENV') === 'production';

  res.clearCookie('accessToken', {
    httpOnly: true,
    secure,
    sameSite: 'lax',
  });

  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure,
    sameSite: 'lax',
  });
}
