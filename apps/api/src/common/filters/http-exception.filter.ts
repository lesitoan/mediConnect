import {
  ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
  Logger,
  type ExceptionFilter,
} from '@nestjs/common';
import type { Response } from 'express';
import { Prisma } from '../../generated/prisma/client';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
      } else if ('message' in body) {
        const detail: unknown = body.message;
        if (typeof detail === 'string') message = detail;
        else if (
          Array.isArray(detail) &&
          detail.every((item) => typeof item === 'string')
        ) {
          message = detail;
        }
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        status = HttpStatus.CONFLICT;
        message = 'Account already exists';
      } else if (exception.code === 'P2025') {
        status = HttpStatus.NOT_FOUND;
        message = 'Resource not found';
      }
    }
    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        'Unhandled request failure',
        exception instanceof Error ? exception.stack : undefined,
      );
    }
    response
      .status(status)
      .json({ success: false, statusCode: status, message });
  }
}
