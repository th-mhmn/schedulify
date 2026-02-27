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
  PrismaClientUnknownRequestError,
  PrismaClientRustPanicError,
} from '@prisma/client/runtime/client.js';

type ErrorBody = {
  statusCode: number;
  message: string | string[];
  error?: string;
  path: string;
  timestamp: string;
  // optional extras
  code?: string;
};

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const { status, body, log } = this.mapError(exception, req);

    // Log everything useful for debugging
    this.logger.error(log.summary, log.stack);

    res.status(status).json({
      ...body,
      path: req.originalUrl,
      timestamp: new Date().toISOString(),
    } satisfies ErrorBody);
  }

  private mapError(
    exception: unknown,
    req: Request,
  ): {
    status: number;
    body: Omit<ErrorBody, 'path' | 'timestamp'>;
    log: { summary: any; stack: string };
  } {
    const ex: any = exception;

    // -------------------------
    // 1) HttpException (includes ValidationPipe errors)
    // -------------------------
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const resp = exception.getResponse();

      // resp can be string or object; ValidationPipe uses object with message[]
      let message: string | string[] = exception.message;
      let error: string | undefined;

      if (typeof resp === 'string') {
        message = resp;
      } else if (resp && typeof resp === 'object') {
        const r = resp as Record<string, any>;
        if (r.message !== undefined) message = r.message;
        if (r.error !== undefined) error = r.error;
      }

      return {
        status,
        body: {
          statusCode: status,
          message,
          error: error ?? HttpStatus[status] ?? 'Error',
        },
        log: {
          summary: {
            method: req.method,
            url: req.originalUrl,
            status,
            type: 'HttpException',
            message,
          },
          stack: ex?.stack ?? String(exception),
        },
      };
    }

    // -------------------------
    // 2) Dependency/network errors (DB down, docker off)
    // -------------------------
    const code = ex?.code;
    const msg = String(ex?.message ?? '').toLowerCase();

    const looksLikeDependencyDown =
      code === 'ECONNREFUSED' ||
      code === 'ETIMEDOUT' ||
      code === 'ENOTFOUND' ||
      msg.includes('econnrefused') ||
      (msg.includes('connect') && msg.includes('refused')) ||
      msg.includes('timeout') ||
      msg.includes("can't reach database server");

    if (looksLikeDependencyDown) {
      const status = HttpStatus.SERVICE_UNAVAILABLE;
      return {
        status,
        body: {
          statusCode: status,
          message: 'Service temporarily unavailable',
          error: 'Service Unavailable',
          code: code ?? 'DEPENDENCY_UNAVAILABLE',
        },
        log: {
          summary: {
            method: req.method,
            url: req.originalUrl,
            status,
            type: 'DependencyDown',
            code,
            message: ex?.message,
          },
          stack: ex?.stack ?? String(exception),
        },
      };
    }

    // -------------------------
    // 3) Prisma errors
    // -------------------------
    if (exception instanceof PrismaClientInitializationError) {
      const status = HttpStatus.SERVICE_UNAVAILABLE;
      return {
        status,
        body: {
          statusCode: status,
          message: 'Service temporarily unavailable',
          error: 'Service Unavailable',
          code: 'PRISMA_INIT_ERROR',
        },
        log: {
          summary: {
            method: req.method,
            url: req.originalUrl,
            status,
            type: 'PrismaClientInitializationError',
            message: ex?.message,
          },
          stack: ex?.stack ?? String(exception),
        },
      };
    }

    if (exception instanceof PrismaClientKnownRequestError) {
      // P2002 etc (only after DB is reachable)
      let status = HttpStatus.BAD_REQUEST;
      let message: string | string[] = 'Invalid request';

      switch (exception.code) {
        case 'P2002':
          status = HttpStatus.CONFLICT;
          message = 'Resource already exists';
          break;
        case 'P2025':
          status = HttpStatus.NOT_FOUND;
          message = 'Resource not found';
          break;
        default:
          status = HttpStatus.BAD_REQUEST;
          message = 'Invalid request';
          break;
      }

      return {
        status,
        body: {
          statusCode: status,
          message,
          error: HttpStatus[status] ?? 'Error',
          code: exception.code,
        },
        log: {
          summary: {
            method: req.method,
            url: req.originalUrl,
            status,
            type: 'PrismaClientKnownRequestError',
            prismaCode: exception.code,
            message: ex?.message,
          },
          stack: ex?.stack ?? String(exception),
        },
      };
    }

    if (exception instanceof PrismaClientValidationError) {
      const status = HttpStatus.BAD_REQUEST;
      return {
        status,
        body: {
          statusCode: status,
          message: 'Invalid request',
          error: 'Bad Request',
          code: 'PRISMA_VALIDATION_ERROR',
        },
        log: {
          summary: {
            method: req.method,
            url: req.originalUrl,
            status,
            type: 'PrismaClientValidationError',
            message: ex?.message,
          },
          stack: ex?.stack ?? String(exception),
        },
      };
    }

    if (
      exception instanceof PrismaClientUnknownRequestError ||
      exception instanceof PrismaClientRustPanicError
    ) {
      const status = HttpStatus.INTERNAL_SERVER_ERROR;
      return {
        status,
        body: {
          statusCode: status,
          message: 'Internal server error',
          error: 'Internal Server Error',
          code: ex?.name ?? 'PRISMA_UNKNOWN',
        },
        log: {
          summary: {
            method: req.method,
            url: req.originalUrl,
            status,
            type: ex?.name ?? 'PrismaUnknown',
            message: ex?.message,
          },
          stack: ex?.stack ?? String(exception),
        },
      };
    }

    // -------------------------
    // 4) Fallback
    // -------------------------
    const status = HttpStatus.INTERNAL_SERVER_ERROR;
    return {
      status,
      body: {
        statusCode: status,
        message: 'Internal server error',
        error: 'Internal Server Error',
      },
      log: {
        summary: {
          method: req.method,
          url: req.originalUrl,
          status,
          type: ex?.name ?? 'UnknownError',
          code: ex?.code,
          message: ex?.message,
        },
        stack: ex?.stack ?? String(exception),
      },
    };
  }
}
