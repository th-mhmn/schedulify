import { extractHourMinute } from '@/_core/utils/time.utils';
import { WorkingHours } from '@/generated/prisma/client';
import { ConflictException, Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';
import { BookingWindow } from '../types/booking-window.type';

@Injectable()
export class BookingWorkingHoursValidator {
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

    if (closeAt < endDate || openAt > startDate)
      throw new ConflictException('Outside working hours');
  }
}
