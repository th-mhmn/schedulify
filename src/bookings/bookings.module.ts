import { Module } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { PrismaService } from '@/prisma.service';
import { ServicesService } from '@/services/services.service';
import { NotificationModule } from '@/notifications/notification.module';
@Module({
  imports: [NotificationModule],
  controllers: [BookingsController],
  providers: [BookingsService, PrismaService, ServicesService],
  exports: [BookingsService],
})
export class BookingsModule {}
