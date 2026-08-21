import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

export const RedisProvider = {
  provide: REDIS_CLIENT,
  inject: [ConfigService],
  useFactory: (config: ConfigService) =>
    new Redis({
      host: config.get('REDIS_HOST'),
      port: config.get<number>('REDIS_PORT'),
      password: config.get('REDIS_PASSWORD'),
    }),
};
