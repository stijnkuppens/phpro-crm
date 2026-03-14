/**
 * Business logic utilities ported from demo_crm.
 * Pure functions — no database or framework dependencies.
 */

/** Count working days (Mon-Fri) between two dates, inclusive. */
export function werkdagenTussen(start: Date, end: Date): number {
  let count = 0;
  const current = new Date(start);
  current.setHours(0, 0, 0, 0);
  const endDate = new Date(end);
  endDate.setHours(0, 0, 0, 0);

  while (current <= endDate) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
}

/** Calculate the contact date: end_date minus notice period minus 30 days. */
export function calcContactDatum(einddatum: Date, opzegtermijnDagen: number): Date {
  const result = new Date(einddatum);
  result.setDate(result.getDate() - opzegtermijnDagen - 30);
  return result;
}

/** Determine effective services based on manual list + active consultant flag. */
export function getEffectiveServices(
  manualServices: string[],
  hasActiveConsultants: boolean,
): string[] {
  const services = [...manualServices];
  if (hasActiveConsultants && !services.includes('Consultancy')) {
    services.push('Consultancy');
  }
  return services;
}

/** Sum of (rate * quantity) for SLA line items. */
export function calcSlaTotal(items: { rate: number; quantity: number }[]): number {
  return items.reduce((sum, item) => sum + item.rate * item.quantity, 0);
}

/** Calculate tariff amount: rate * working days between start and end. */
export function calcTarief(rate: number, startDate: Date, endDate: Date): number {
  return rate * werkdagenTussen(startDate, endDate);
}

/** Get December 31 of the given date's year. */
export function eindVanJaar(date: Date): Date {
  return new Date(date.getFullYear(), 11, 31);
}
