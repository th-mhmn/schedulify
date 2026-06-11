import {
  applyDecorators,
  Type,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { ApiIdempotencyKey } from '@/common/api-idempotency-key.decorator';
import { IdempotencyInterceptor } from '../interceptors/idempotency-key.interceptor';
import { TransformDTO } from '../interceptors/transform-dto.interceptor';

interface EndpointOptions {
  summary: string;

  requestDto?: Type<any>;
  responseDto?: Type<any>;

  auth?: boolean;
  idempotent?: boolean;

  successStatus?: 200 | 201 | 204;
  successDescription?: string;

  params?: {
    name: string;
    description?: string;
    required?: boolean;
    example?: string | number;
    type?: StringConstructor | NumberConstructor;
  }[];
}

export function Endpoint(options: EndpointOptions) {
  const decorators: MethodDecorator[] = [];

  decorators.push(
    ApiOperation({
      summary: options.summary,
    }),
  );

  if (options.requestDto) {
    decorators.push(
      ApiBody({
        type: options.requestDto,
      }),
    );
  }

  if (options.responseDto) {
    decorators.push(
      ApiCreatedResponse({
        type: options.responseDto,
      }),
    );

    decorators.push(TransformDTO(options.responseDto) as MethodDecorator);
  }

  if (options.auth) {
    decorators.push(
      ApiBearerAuth(),
      ApiUnauthorizedResponse({
        description: 'Unauthorized',
      }),
      UseGuards(JwtAuthGuard),
    );
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

  if (options.responseDto) {
    switch (options.successStatus) {
      case 200:
        decorators.push(
          ApiOkResponse({
            type: options.responseDto,
            description: options.successDescription,
          }),
        );
        break;

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
          ApiNoContentResponse({
            description: options.successDescription,
          }),
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

    decorators.push(TransformDTO(options.responseDto) as MethodDecorator);
  }

  return applyDecorators(...decorators);
}
