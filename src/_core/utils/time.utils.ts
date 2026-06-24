export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function extractHourMinute(minutes: number) {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return { hour, minute };
}

export function minutesToTime(minutes: number): string {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return `${padZero(hour)}:${padZero(minute)}`;
}

export function padZero(value: number): string {
  return value < 10 ? `0${value}` : `${value}`;
}
