import { DateTime } from 'luxon';

export const formatDateTimeToHour = (date: DateTime) => {
  let hour: number | string = date.hour;
  let minute: number | string = date.minute;
  if (hour < 10) hour = `0${hour}`;
  if (minute < 10) minute = `0${minute}`;
  return `${hour}:${minute}`;
};

export const formatUtcToHour = (date_UTC: Date) => {
  const dt = DateTime.fromJSDate(date_UTC);
  return `${dt.hour < 10 ? `0${dt.hour}` : dt.hour}:${dt.minute < 10 ? `0${dt.minute}` : dt.minute}`;
};
