function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function parseIsoDate(isoDate: string): Date {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1, 12, 0, 0, 0);
}

export function formatIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function getTodayIsoDateLocal(): string {
  return formatIsoDate(new Date());
}

export function shiftIsoDate(isoDate: string, diffDays: number): string {
  const date = parseIsoDate(isoDate);
  date.setDate(date.getDate() + diffDays);
  return formatIsoDate(date);
}

export function buildDayWindow(centerDate: string, radius = 3): string[] {
  return Array.from({ length: radius * 2 + 1 }, (_, index) => shiftIsoDate(centerDate, index - radius));
}

function getStartOfWeek(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + diff);
  return new Date(result.getFullYear(), result.getMonth(), result.getDate(), 12, 0, 0, 0);
}

export function getWeekRange(isoDate: string): { start: string; end: string } {
  const start = getStartOfWeek(parseIsoDate(isoDate));
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return {
    start: formatIsoDate(start),
    end: formatIsoDate(end)
  };
}

export function getWeekNumber(isoDate: string): number {
  const date = parseIsoDate(isoDate);
  const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNumber = utcDate.getUTCDay() || 7;
  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - dayNumber);
  const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
  return Math.ceil((((utcDate.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}
