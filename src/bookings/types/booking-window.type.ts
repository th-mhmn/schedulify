import { DateTime } from 'luxon';

export interface BookingWindow {
  startDate: DateTime;
  endDate: DateTime;
  dayOfWeek: number;
}
