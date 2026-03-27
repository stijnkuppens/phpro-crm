import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const supabase = createServiceRoleClient();
    const { error } = await supabase.from('app_settings').select('id').limit(1).single();
    if (error) throw error;
    return NextResponse.json({ status: 'ok' }, { status: 200 });
  } catch {
    return NextResponse.json({ status: 'degraded' }, { status: 503 });
  }
}
