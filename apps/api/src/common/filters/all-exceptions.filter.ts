import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { Prisma } from '../../generated/prisma/client.js';

interface ErrorBody {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
}

interface ResolvedError {
  statusCode: number;
  message: string | string[];
  error: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<{ url: string }>();

    const { statusCode, message, error } = this.resolveError(exception);

    const body: ErrorBody = {
      statusCode,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(statusCode).json(body);
  }

  private resolveError(exception: unknown): ResolvedError {
    // Caso 1: ya es una HttpException de Nest (NotFoundException, ConflictException,
    // BadRequestException de ValidationPipe, ForbiddenException, etc.)
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();

      if (typeof response === 'string') {
        return { statusCode: status, message: response, error: exception.name };
      }

      const responseObject = response as {
        message?: string | string[];
        error?: string;
      };

      return {
        statusCode: status,
        message: responseObject.message ?? exception.message,
        error: responseObject.error ?? exception.name,
      };
    }

    // Caso 2: un error propio de Prisma que dejamos escapar sin comprobación previa,
    // como la carrera de un nombre duplicado (L03) o un update/delete a algo ya borrado.
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        return {
          statusCode: HttpStatus.CONFLICT,
          message: 'Resource already exists',
          error: 'Conflict',
        };
      }

      if (exception.code === 'P2025') {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Resource not found',
          error: 'Not Found',
        };
      }

      if (exception.code === 'P2003') {
        return {
          statusCode: HttpStatus.CONFLICT,
          message: 'Cannot complete this action: the resource is still in use',
          error: 'Conflict',
        };
      }
    }

    // Caso 3: cualquier otra cosa es un bug de verdad. No exponemos su mensaje interno.
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      error: 'Internal Server Error',
    };
  }
}
