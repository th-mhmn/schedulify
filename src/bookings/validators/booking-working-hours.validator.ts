import { WorkingHours } from '@/generated/prisma/client';
import { ConflictException, Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';
import { BookingWindow } from '../types/booking-window.type';

@Injectable()
export class BookingWorkingHoursValidator {
  validate(workingHours: WorkingHours, bookingWindow: BookingWindow): void {
    const { startDate, endDate } = bookingWindow;
    const { day, month, year } = startDate;
    const start_hour_minute = workingHours.startTime.split(':');
    const end_hour_minute = workingHours.endTime.split(':');

    const openAt = DateTime.fromObject({
      year,
      month,
      day,
      hour: Number(start_hour_minute[0]),
      minute: Number(start_hour_minute[1]),
    });

    const closeAt = DateTime.fromObject({
      year,
      month,
      day,
      hour: Number(end_hour_minute[0]),
      minute: Number(end_hour_minute[1]),
    });

    if (closeAt < endDate || openAt > startDate)
      throw new ConflictException('Outside working hours');
  }
}
