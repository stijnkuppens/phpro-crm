import type { Consultant, ContractStatus } from './types';

export function getContractStatus(consultant: Consultant): ContractStatus {
  if (consultant.status === 'stopgezet') return 'stopgezet';
  if (consultant.is_indefinite || !consultant.end_date) return 'onbepaald';
  const days = Math.ceil((new Date(consultant.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days < 0) return 'verlopen';
  if (days <= 60) return 'kritiek';
  if (days <= 120) return 'waarschuwing';
  return 'actief';
}

/** Accepts any object with rate_history and hourly_rate — works for both
 *  full ConsultantWithDetails and lightweight stats rows. */
export function getCurrentRate(consultant: {
  hourly_rate: number | null;
  rate_history: { date: string; rate: number }[];
}): number {
  if (!consultant.rate_history || consultant.rate_history.length === 0) {
    return Number(consultant.hourly_rate ?? 0);
  }
  const now = new Date();
  const pastRates = consultant.rate_history.filter(
    (r) => new Date(r.date) <= now,
  );
  if (pastRates.length === 0) {
    return Number(consultant.hourly_rate ?? 0);
  }
  const sorted = [...pastRates].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
  return Number(sorted[0].rate);
}
