/**
 * Escapes PostgREST ilike metacharacters in user search input.
 * Prevents users from injecting wildcard patterns.
 */
export function escapeSearch(input: string): string {
  return input.replace(/[%_\\]/g, '\\$&');
}
