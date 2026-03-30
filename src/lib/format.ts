// Module-level formatter instances — constructed once, reused everywhere.
const currencyFormatter = new Intl.NumberFormat('nl-BE', {
  style: 'currency',
  currency: 'EUR',
});
const eurFormatter = new Intl.NumberFormat('nl-BE', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});
const eurPreciseFormatter = new Intl.NumberFormat('nl-BE', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const numberFormatter = new Intl.NumberFormat('nl-BE');
const percentFormatter = new Intl.NumberFormat('nl-BE', {
  style: 'percent',
  maximumFractionDigits: 0,
});

/** Format a number as EUR currency */
export function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

/** Format as EUR without decimals: € 1.234 */
export function formatEUR(value: number): string {
  return eurFormatter.format(value);
}

/** Format as EUR with 2 decimals: € 1.234,56 */
export function formatEURPrecise(value: number): string {
  return eurPreciseFormatter.format(value);
}

/** Format a plain number with locale grouping: 1.234 */
export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

/** Format as percentage: 42% */
export function formatPercent(value: number): string {
  return percentFormatter.format(value / 100);
}

/** Format a date as DD/MM/YYYY */
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('nl-BE').format(new Date(date));
}

/** Format a datetime as DD/MM/YYYY HH:mm */
export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('nl-BE', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(date));
}

/** Days between now and a target date (negative = past) */
export function daysUntilDate(date: string | Date): number {
  const target = new Date(date);
  const now = new Date();
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}
