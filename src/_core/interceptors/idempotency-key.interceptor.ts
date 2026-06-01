import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
  Inject,
} from '@nestjs/common';

import { Observable, of, from } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import * as crypto from 'crypto';

import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}
  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();

    const key = request.headers['idempotency-key'];

    if (!key || typeof key !== 'string') {
      throw new BadRequestException('Missing Idempotency-Key header');
    }

    if (!this.isValidUUID(key)) {
      throw new BadRequestException("Header 'idempotency-key' must be a UUID.");
    }

    const keyHash = crypto.createHash('sha256').update(key).digest('hex');

    request.idempotencyKeyHash = keyHash;

    return from(this.cacheManager.get(keyHash)).pipe(
      switchMap((cached) => {
        if (cached) {
          return of(cached);
        }

        return next.handle().pipe(
          tap((response) => {
            this.cacheManager.set(keyHash, response, 60 * 60 * 24);
          }),
        );
      }),
    );
  }
  private isValidUUID(uuid: string) {
    const uuidRegex =
      /(?:^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[a-f0-9]{4}-[a-f0-9]{12}$)|(?:^0{8}-0{4}-0{4}-0{4}-0{12}$)/u;
    return uuidRegex.test(uuid);
  }
}
