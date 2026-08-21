import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { BusinessesModule } from './businesses/businesses.module';
import { ServicesModule } from './services/services.module';
import { BookingsModule } from './bookings/bookings.module';
import { ResourceModule } from './resource/resource.module';
import { WorkingHoursModule } from './working-hours/working-hours.module';
import { BlocksModule } from './blocks/blocks.module';
import { CacheModule } from '@nestjs/cache-manager';
import { QueueModule } from './queue/queue.module';
import { NotificationModule } from './notifications/notification.module';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerBehindProxyGuard } from './_core/guards/throttler-behind-proxy.guard';
import { ThrottlerModule } from '@nestjs/throttler';
import { HealthModule } from './health/health.module';
@Module({
  imports: [
    CacheModule.register({ isGlobal: true }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.ENV_FILE ?? '.env.local',
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
