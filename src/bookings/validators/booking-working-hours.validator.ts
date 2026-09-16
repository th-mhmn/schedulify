import { extractHourMinute } from '@/_core/utils/time.utils';
import { WorkingHours } from '@/generated/prisma/client';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { DateTime } from 'luxon';
import { BookingWindow } from '../types/booking-window.type';

@Injectable()
export class BookingWorkingHoursValidator {
  private readonly logger = new Logger(BookingWorkingHoursValidator.name, {
    timestamp: true,
  });

  validate(workingHours: WorkingHours, bookingWindow: BookingWindow): void {
    const { startDate, endDate } = bookingWindow;
    const { day, month, year } = startDate;
    const { hour: startHour, minute: startMinute } = extractHourMinute(
      workingHours.startMinute,
    );
    const { hour: endHour, minute: endMinute } = extractHourMinute(
      workingHours.endMinute,
    );

    const openAt = DateTime.fromObject(
      {
        year,
        month,
        day,
        hour: startHour,
        minute: startMinute,
      },
      { zone: startDate.zone },
    );

    const closeAt = DateTime.fromObject(
      {
        year,
        month,
        day,
        hour: endHour,
        minute: endMinute,
      },
      { zone: startDate.zone },
    );

    if (closeAt < endDate || openAt > startDate) {
      this.logger.warn(
        {
          startTime: bookingWindow.startDate,
          endTime: bookingWindow.endDate,
        },
        'Booking rejected outside working hours',
      );
      throw new BadRequestException('Outside working hours');
    }
  }
}
