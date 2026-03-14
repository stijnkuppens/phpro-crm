import { z } from 'zod';

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().min(1),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

const serverSchema = z.object({
  SUPABASE_URL: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  WEBHOOK_SECRET: z.string().min(1).optional(),
});

function validateEnv<T extends z.ZodType>(schema: T, env: Record<string, unknown>, label: string): z.infer<T> {
  const result = schema.safeParse(env);
  if (!result.success) {
    const missing = result.error.issues.map((i) => i.path.join('.')).join(', ');
    throw new Error(`❌ Missing or invalid ${label} env vars: ${missing}\nCheck your .env file.`);
  }
  return result.data;
}

// Lazy validation: validate on first access, not at module top level.
// This prevents build failures during `next build` SSR prerendering
// when env vars may not be set.
let _clientEnv: z.infer<typeof clientSchema> | null = null;
export function getClientEnv() {
  if (!_clientEnv) {
    _clientEnv = validateEnv(clientSchema, {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    }, 'client');
  }
  return _clientEnv;
}

let _serverEnv: z.infer<typeof serverSchema> | null = null;
export function getServerEnv() {
  if (!_serverEnv) {
    _serverEnv = validateEnv(serverSchema, {
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      WEBHOOK_SECRET: process.env.WEBHOOK_SECRET,
    }, 'server');
  }
  return _serverEnv;
}
