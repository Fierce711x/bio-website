import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Prisma } from '#src/generated/client.js';
import { AppErrorResponse, ErrorCode } from '#src/errors/errorTypes.js';
import { mapPrismaError } from '#src/errors/prismaErrorMapper.js';
import type { Response } from 'express';
@Catch(HttpException)
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();

    const error = this.normalize(exception);
    response.status(error.statusCode).json(error);
  }

  private normalize(exception: unknown): AppErrorResponse {
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return mapPrismaError(exception);
    }

    if (exception instanceof HttpException) {
      return this.mapHttpException(exception);
    }

    return {
      code: ErrorCode.UNKNOWN_ERROR,
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred.',
    };
  }

  private mapHttpException(exception: HttpException): AppErrorResponse {
    const statusCode = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const message = this.extractMessage(exceptionResponse);

    return {
      code: this.mapStatusToErrorCode(statusCode),
      statusCode,
      message,
    };
  }

  private extractMessage(response: string | object): string {
    if (typeof response === 'string') {
      return response;
    }

    if (
      response &&
      'message' in response &&
      typeof response.message === 'string'
    ) {
      return response.message;
    }

    if (response && 'message' in response && Array.isArray(response.message)) {
      return response.message.join(', ');
    }

    return 'An error occurred.';
  }

  private mapStatusToErrorCode(statusCode: HttpStatus): ErrorCode {
    switch (statusCode) {
      case HttpStatus.BAD_REQUEST:
        return ErrorCode.BAD_REQUEST;

      case HttpStatus.UNAUTHORIZED:
        return ErrorCode.UNAUTHORIZED;

      case HttpStatus.FORBIDDEN:
        return ErrorCode.FORBIDDEN;

      case HttpStatus.NOT_FOUND:
        return ErrorCode.NOT_FOUND;

      case HttpStatus.CONFLICT:
        return ErrorCode.CONFLICT;

      case HttpStatus.TOO_MANY_REQUESTS:
        return ErrorCode.TOO_MANY_REQUESTS;

      default:
        return ErrorCode.UNKNOWN_ERROR;
    }
  }
}
