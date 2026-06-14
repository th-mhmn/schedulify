import { NotificationModule } from '@/notifications/notification.module';
import { PrismaService } from '@/prisma.service';
import { ServicesService } from '@/services/services.service';
import { Module } from '@nestjs/common';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { BookingAvailabilityService } from './validators/booking-conflict.validator';
import { BookingWorkingHoursValidator } from './validators/booking-working-hours.validator';
@Module({
  imports: [NotificationModule],
  controllers: [BookingsController],
  providers: [
    BookingsService,
    PrismaService,
    ServicesService,
    BookingWorkingHoursValidator,
    BookingAvailabilityService,
  ],
  exports: [BookingsService],
})
export class BookingsModule {}
