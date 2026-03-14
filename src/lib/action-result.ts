/**
 * Standardized return type for all server actions.
 *
 * Usage:
 *   return ok(data)       → { success: true, data }
 *   return ok()           → { success: true }
 *   return err('msg')     → { error: 'msg' }
 *   return err(fieldErrs) → { error: { name: ['required'] } }
 */

export type ActionResult<T = void> =
  | { success: true; data?: T; error?: never }
  | { error: string | Record<string, string[]>; success?: never; data?: never };

export function ok(): ActionResult<void>;
export function ok<T>(data: T): ActionResult<T>;
export function ok<T>(data?: T): ActionResult<T> {
  return data !== undefined ? { success: true, data } : { success: true };
}

export function err(error: string | Record<string, string[]>): ActionResult<never> {
  return { error };
}
