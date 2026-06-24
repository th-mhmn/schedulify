import { minutesToTime } from '@/_core/utils/time.utils';
import { Expose, Transform } from 'class-transformer';

export class WorkingHoursDto {
  @Expose()
  @Transform(({ obj }) => convertDays(obj.dayOfWeek))
  dayOfWeek: string;

  @Expose()
  @Transform(({ obj }) => minutesToTime(obj.startMinute))
  startTime: string;

  @Expose()
  @Transform(({ obj }) => minutesToTime(obj.endMinute))
  endTime: string;
}

function convertDays(index: number) {
  switch (index) {
    case 0:
      return 'Monday';
    case 1:
      return 'Tuesday';
    case 2:
      return 'Wednesday';
    case 3:
      return 'Thursday';
    case 4:
      return 'Friday';
    case 5:
      return 'Saturday';
    case 6:
      return 'Sunday';
    default:
      return 'N/A';
  }
}
