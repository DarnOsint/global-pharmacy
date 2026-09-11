import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const checks: Record<string, string> = {};

  const { error: productsError } = await supabase.from('products').select('id').limit(1);
  checks.products = productsError ? `MISSING (${productsError.message})` : 'ok';

  const { error: settingsError } = await supabase.from('settings').select('key').limit(1);
  checks.settings = settingsError
    ? `MISSING (${settingsError.message})`
    : 'ok';

  const missing = Object.entries(checks)
    .filter(([, status]) => status !== 'ok')
    .map(([table]) => table);

  if (missing.length > 0) {
    return NextResponse.json({
      status: 'partial',
      message: `Connection works but the following table(s) are missing from your Supabase project: ${missing.join(', ')}. Run supabase/migration.sql (look for the settings table) in your Supabase SQL Editor.`,
      checks,
    }, { status: 207 });
  }

  return NextResponse.json({
    status: 'connected',
    message: 'Supabase connection successful',
    checks,
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  });
}