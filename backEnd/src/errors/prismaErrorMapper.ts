import { Prisma } from '#src/generated/client.js';
import { AppErrorResponse, ErrorCode } from './errorTypes.js';

export function mapPrismaError(
  exception: Prisma.PrismaClientKnownRequestError,
): AppErrorResponse {
  switch (exception.code) {
    case 'P2002':
      return {
        code: ErrorCode.DATABASE_UNIQUE_CONSTRAINT,
        statusCode: 409,
        message: 'A record with these values already exists.',
      };

    case 'P2003':
      return {
        code: ErrorCode.DATABASE_FOREIGN_KEY,
        statusCode: 409,
        message: 'This operation violates a data relationship.',
      };

    case 'P2025':
      return {
        code: ErrorCode.DATABASE_NOT_FOUND,
        statusCode: 404,
        message: 'The requested record was not found.',
      };

    default:
      return {
        code: ErrorCode.DATABASE_ERROR,
        statusCode: 500,
        message: 'A database error occurred.',
      };
  }
}
