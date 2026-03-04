import { DateTime } from 'luxon';

export const getHours = (date_UTC: Date) => {
  const dt = DateTime.fromJSDate(date_UTC);
  return `${dt.hour}:${dt.minute === 0 ? '00' : dt.minute}`;
};
