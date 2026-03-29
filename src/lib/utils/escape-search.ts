/**
 * Escapes PostgREST ilike metacharacters in user search input.
 * Prevents users from injecting wildcard patterns or breaking orFilter syntax.
 */
export function escapeSearch(input: string): string {
  return input
    .replace(/[%_\\]/g, '\\$&')
    .replace(/,/g, ''); // Strip commas — PostgREST OR separator, cannot be escaped in ilike values
}
