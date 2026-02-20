import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  UseInterceptors,
} from '@nestjs/common';
import { type ClassConstructor, plainToInstance } from 'class-transformer';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export function TransformDTO<T>(dto: ClassConstructor<T>) {
  return UseInterceptors(new TransformDTOInterceptor(dto));
}

@Injectable()
export class TransformDTOInterceptor<T> implements NestInterceptor {
  constructor(private readonly dtoClass: ClassConstructor<T>) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const isAuthenticationUrl = request.path.includes('auth');
    return next.handle().pipe(
      map((data) => {
        if (data && Object.prototype.hasOwnProperty.call(data, 'hasNextPage')) {
          const { items, hasNextPage, cursor } = data;
          return {
            message: 'Success',
            data: plainToInstance(this.dtoClass, items, {
              excludeExtraneousValues: true,
            }),
            hasNextPage,
            cursor,
          };
        }

        if (isAuthenticationUrl) {
          const { user, accessToken } = data;
          return {
            message: 'Success',
            data: plainToInstance(this.dtoClass, user, {
              excludeExtraneousValues: true,
            }),
            accessToken,
          };
        }
        return {
          message: 'Success',
          data: plainToInstance(this.dtoClass, data, {
            excludeExtraneousValues: true,
          }),
        };
      }),
    );
  }
}
