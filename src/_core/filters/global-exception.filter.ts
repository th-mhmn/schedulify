import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  PrismaClientInitializationError,
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
} from '@prisma/client/runtime/client.js';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const { status, message } = this.mapError(exception);

    const exAny = exception as any;
    this.logger.error(
      {
        method: req.method,
        url: req.originalUrl,
        status,
        message,
        name: exAny?.name,
        code: exAny?.code,
      },
      exAny?.stack ?? String(exception),
    );

    res.status(status).json({
      statusCode: status,
      message,
      path: req.originalUrl,
      timestamp: new Date().toISOString(),
    });
  }

  private mapError(exception: unknown): { status: number; message: string } {
    // Nest-thrown HttpExceptions
    if (exception instanceof HttpException) {
      return { status: exception.getStatus(), message: exception.message };
    }

    const ex: any = exception;
    const code = ex?.code;
    const msg = String(ex?.message ?? '').toLowerCase();

    // 🔥 DB/dependency down (Docker off, connection refused, DNS fail, timeout)
    if (
      code === 'ECONNREFUSED' ||
      code === 'ETIMEDOUT' ||
      code === 'ENOTFOUND' ||
      msg.includes('econnrefused') ||
      (msg.includes('connect') && msg.includes('refused')) ||
      msg.includes('timeout')
    ) {
      return {
        status: HttpStatus.SERVICE_UNAVAILABLE,
        message: 'Service temporarily unavailable',
      };
    }

    // Prisma init errors (also common when DB is unreachable)
    if (exception instanceof PrismaClientInitializationError) {
      return {
        status: HttpStatus.SERVICE_UNAVAILABLE,
        message: 'Service temporarily unavailable',
      };
    }

    // Prisma known request errors (only after DB reachable)
    if (exception instanceof PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002':
          return {
            status: HttpStatus.CONFLICT,
            message: 'Resource already exists',
          };
        case 'P2025':
          return {
            status: HttpStatus.NOT_FOUND,
            message: 'Resource not found',
          };
        default:
          return { status: HttpStatus.BAD_REQUEST, message: 'Invalid request' };
      }
    }

    // Prisma validation errors
    if (exception instanceof PrismaClientValidationError) {
      return { status: HttpStatus.BAD_REQUEST, message: 'Invalid request' };
    }

    // Fallback
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    };
  }
}
