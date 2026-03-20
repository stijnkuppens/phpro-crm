import type { ZodError } from 'zod';

/**
 * Convert Zod validation errors to a flat field error map.
 * Use with form field components that accept an `errors` prop.
 *
 * Usage:
 *   const parsed = schema.safeParse(values);
 *   if (!parsed.success) setFieldErrors(zodFieldErrors(parsed.error));
 */
export function zodFieldErrors(error: ZodError): Record<string, boolean> {
  const errors: Record<string, boolean> = {};
  for (const issue of error.issues) {
    if (issue.path[0] != null) {
      errors[String(issue.path[0])] = true;
    }
  }
  return errors;
}

/** CSS class for required fields with validation errors */
export const fieldErrorClass = 'border-b-2 border-b-destructive';
