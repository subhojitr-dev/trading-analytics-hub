interface Dated {
  year: number;
  month: number;
  week: number;
  date: string;
}

export interface DateGroup<T> {
  date: string;
  items: T[];
}

export interface WeekGroup<T> {
  week: number;
  dates: DateGroup<T>[];
}

export interface MonthGroup<T> {
  month: number;
  weeks: WeekGroup<T>[];
}

export interface YearGroup<T> {
  year: number;
  months: MonthGroup<T>[];
}

export function buildTree<T extends Dated>(entries: T[]): YearGroup<T>[] {
  const years = new Map<number, Map<number, Map<number, Map<string, T[]>>>>();

  for (const entry of entries) {
    if (!years.has(entry.year)) years.set(entry.year, new Map());
    const months = years.get(entry.year)!;
    if (!months.has(entry.month)) months.set(entry.month, new Map());
    const weeks = months.get(entry.month)!;
    if (!weeks.has(entry.week)) weeks.set(entry.week, new Map());
    const dates = weeks.get(entry.week)!;
    if (!dates.has(entry.date)) dates.set(entry.date, []);
    dates.get(entry.date)!.push(entry);
  }

  const sortDesc = (a: number, b: number) => b - a;

  return Array.from(years.entries())
    .sort(([a], [b]) => sortDesc(a, b))
    .map(([year, months]) => ({
      year,
      months: Array.from(months.entries())
        .sort(([a], [b]) => sortDesc(a, b))
        .map(([month, weeks]) => ({
          month,
          weeks: Array.from(weeks.entries())
            .sort(([a], [b]) => sortDesc(a, b))
            .map(([week, dates]) => ({
              week,
              dates: Array.from(dates.entries())
                .sort(([a], [b]) => b.localeCompare(a))
                .map(([date, items]) => ({ date, items })),
            })),
        })),
    }));
}
