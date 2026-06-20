import { NotificationModule } from '@/notifications/notification.module';
import { PrismaService } from '@/prisma.service';
import { ServicesModule } from '@/services/services.module';
import { Module } from '@nestjs/common';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { BookingAvailabilityService } from './validators/booking-conflict.validator';
import { BookingWorkingHoursValidator } from './validators/booking-working-hours.validator';
@Module({
  imports: [NotificationModule, ServicesModule],
  controllers: [BookingsController],
  providers: [
    BookingsService,
    PrismaService,
    BookingWorkingHoursValidator,
    BookingAvailabilityService,
  ],
  exports: [BookingsService],
})
export class BookingsModule {}
