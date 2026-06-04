import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
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
@Module({
  imports: [
    CacheModule.register({ isGlobal: true }),
    ConfigModule.forRoot({
      isGlobal: true,
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
