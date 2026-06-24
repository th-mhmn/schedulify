import { DateTime } from 'luxon';
import { padZero } from './time.utils';

export const formatDateTimeToHour = (date: DateTime) => {
  let hour: number | string = date.hour;
  let minute: number | string = date.minute;
  return `${padZero(hour)}:${padZero(minute)}`;
};

export const formatUtcToHour = (date_UTC: Date) => {
  const dt = DateTime.fromJSDate(date_UTC);
  return `${dt.hour < 10 ? `0${dt.hour}` : dt.hour}:${dt.minute < 10 ? `0${dt.minute}` : dt.minute}`;
};
