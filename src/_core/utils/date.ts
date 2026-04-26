import { DateTime } from 'luxon';

export const formatDateToHour = (date: DateTime) => {
  let hour: number | string = date.hour;
  let minute: number | string = date.minute;
  if (hour < 10) hour = `0${hour}`;
  if (minute < 10) minute = `0${minute}`;
  return `${hour}:${minute}`;
};
