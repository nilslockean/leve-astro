export default class DateComparator {
  private baseDate: Date;

  constructor(baseDate: Date) {
    this.baseDate = baseDate;
  }

  isFuture(input: string | Date): boolean {
    const timestamp =
      typeof input === "string" ? Date.parse(input) : input.getTime();

    if (Number.isNaN(timestamp)) {
      throw new Error(`Invalid input parameter: ${input}`);
    }

    return timestamp > this.baseDate.getTime();
  }

  isPast(dateStr: string): boolean {
    return Date.parse(dateStr) < this.baseDate.getTime();
  }

  isPresentOrFuture(dateStr: string): boolean {
    return !this.isPast(dateStr);
  }
}
