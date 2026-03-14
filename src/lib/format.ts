/** Format a number as EUR currency */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('nl-BE', { style: 'currency', currency: 'EUR' }).format(value);
}

/** Format a date as DD/MM/YYYY */
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('nl-BE').format(new Date(date));
}

/** Format a datetime as DD/MM/YYYY HH:mm */
export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('nl-BE', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(date));
}

/** Days between now and a target date (negative = past) */
export function daysUntilDate(date: string | Date): number {
  const target = new Date(date);
  const now = new Date();
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}
