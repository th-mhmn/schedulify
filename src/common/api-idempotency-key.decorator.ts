import { applyDecorators } from '@nestjs/common';
import { ApiHeader } from '@nestjs/swagger';

export function ApiIdempotencyKey() {
  return applyDecorators(
    ApiHeader({
      name: 'Idempotency-Key',
      required: true,
      description: 'UUID v4 idempotency key',
      schema: {
        type: 'string',
        format: 'uuid',
      },
      example: '550e8400-e29b-41d4-a716-446655440000',
    }),
  );
}
