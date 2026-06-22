import {
  applyDecorators,
  Type,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { ApiIdempotencyKey } from '@/common/api-idempotency-key.decorator';
import { IdempotencyInterceptor } from '../interceptors/idempotency-key.interceptor';

interface EndpointOptions {
  summary: string;

  requestDto?: Type<any>;
  responseDto?: Type<any>;

  auth?: boolean;
  authCookie?: 'Refresh' | 'Authentication';
  authDescription?: string;
  idempotent?: boolean;

  successStatus?: 200 | 201 | 204;
  successDescription?: string;

  notFoundDescription?: string;

  requireOwnership?: boolean;
  forbiddenDescription?: string;

  params?: {
    name: string;
    description?: string;
    required?: boolean;
    example?: string | number;
    type?: StringConstructor | NumberConstructor;
  }[];

  query?: {
    name: string;
    description?: string;
    required?: boolean;
    example?: string | number;
    type?: StringConstructor | NumberConstructor;
  }[];

  badRequestDescription?: string;
}

export function Endpoint(options: EndpointOptions) {
  const decorators: MethodDecorator[] = [];

  decorators.push(ApiOperation({ summary: options.summary }));

  if (options.requestDto) {
    decorators.push(ApiBody({ type: options.requestDto }));
  }

  if (options.auth) {
    decorators.push(
      ApiBearerAuth(),
      ApiUnauthorizedResponse({
        description: options.authDescription ?? 'Unauthorized',
      }),
      UseGuards(JwtAuthGuard),
    );
    if (options.authCookie) {
      decorators.push(ApiCookieAuth(options.authCookie));
    }
  }

  if (options.idempotent) {
    decorators.push(
      ApiIdempotencyKey(),
      UseInterceptors(IdempotencyInterceptor),
    );
  }

  options.params?.forEach((param) => {
    decorators.push(
      ApiParam({
        name: param.name,
        description: param.description,
        required: param.required ?? true,
        example: param.example,
        type: param.type ?? String,
      }),
    );
  });

  options.query?.forEach((query) => {
    decorators.push(
      ApiQuery({
        name: query.name,
        description: query.description,
        required: query.required ?? true,
        example: query.example,
        type: query.type ?? String,
      }),
    );
  });

  if (options.responseDto) {
    switch (options.successStatus) {
      case 201:
        decorators.push(
          ApiCreatedResponse({
            type: options.responseDto,
            description: options.successDescription,
          }),
        );
        break;
      case 204:
        decorators.push(
          ApiNoContentResponse({ description: options.successDescription }),
        );
        break;
      default:
        decorators.push(
          ApiOkResponse({
            type: options.responseDto,
            description: options.successDescription,
          }),
        );
    }
  }

  if (options.badRequestDescription) {
    decorators.push(
      ApiBadRequestResponse({ description: options.badRequestDescription }),
    );
  }

  if (options.notFoundDescription) {
    decorators.push(
      ApiNotFoundResponse({ description: options.notFoundDescription }),
    );
  }

  if (options.requireOwnership) {
    decorators.push(
      ApiForbiddenResponse({
        description: options.forbiddenDescription ?? 'Forbidden',
      }),
    );
  }

  return applyDecorators(...decorators);
}
