import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { randomUUID } from 'node:crypto';
import { ThrottlerBehindProxyGuard } from './_core/guards/throttler-behind-proxy.guard';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { BlocksModule } from './blocks/blocks.module';
import { BookingsModule } from './bookings/bookings.module';
import { BusinessesModule } from './businesses/businesses.module';
import { HealthModule } from './health/health.module';
import { NotificationModule } from './notifications/notification.module';
import { QueueModule } from './queue/queue.module';
import { ResourceModule } from './resource/resource.module';
import { ServicesModule } from './services/services.module';
import { UsersModule } from './users/users.module';
import { WorkingHoursModule } from './working-hours/working-hours.module';

@Module({
  imports: [
    CacheModule.register({ isGlobal: true }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.ENV_FILE ?? '.env.local',
    }),
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],

      useFactory: (config: ConfigService) => ({
        genReqId: (req) => {
          const requestId = req.headers['x-request-id'];

          if (typeof requestId === 'string') {
            return requestId;
          }

          return randomUUID();
        },

        pinoHttp: {
          level: config.get<string>('LOG_LEVEL', 'info'),

          transport:
            config.get<string>('NODE_ENV') === 'development'
              ? {
                  target: 'pino-pretty',
                  options: {
                    colorize: true,
                    singleLine: true,
                    translateTime: 'SYS:standard',
                  },
                }
              : undefined,
        },
      }),
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          name: 'short',
          ttl: config.getOrThrow<number>('THROTTLE_SHORT_TTL'),
          limit: config.getOrThrow<number>('THROTTLE_SHORT_LIMIT'),
        },
        {
          name: 'medium',
          ttl: config.getOrThrow<number>('THROTTLE_MEDIUM_TTL'),
          limit: config.getOrThrow<number>('THROTTLE_MEDIUM_LIMIT'),
        },
        {
          name: 'long',
          ttl: config.getOrThrow<number>('THROTTLE_LONG_TTL'),
          limit: config.getOrThrow<number>('THROTTLE_LONG_LIMIT'),
        },
      ],
    }),
    QueueModule,
    AuthModule,
    UsersModule,
    BusinessesModule,
    ResourceModule,
    ServicesModule,
    BookingsModule,
    WorkingHoursModule,
    BlocksModule,
    NotificationModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerBehindProxyGuard,
    },
    AppService,
  ],
})
export class AppModule {}
