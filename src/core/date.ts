import { format, startOfWeek } from 'date-fns';

export type WeekStartOption = 'sunday' | 'monday';

export const DATE_KEY_FORMAT = 'yyyy-MM-dd';

export function toDateKey(date: Date): string {
  return format(date, DATE_KEY_FORMAT);
}

export function getLocalTodayKey(): string {
  return toDateKey(new Date());
}

export function getStartOfWeek(date: Date, weekStartsOn: WeekStartOption): Date {
  const weekStartsOnIndex = weekStartsOn === 'sunday' ? 0 : 1;
  return startOfWeek(date, { weekStartsOn: weekStartsOnIndex });
}

export function getWeekKey(date: Date, weekStartsOn: WeekStartOption): string {
  return toDateKey(getStartOfWeek(date, weekStartsOn));
}
