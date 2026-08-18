import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase.from('products').select('id').limit(1);

    if (error) {
      return NextResponse.json({
        status: 'error',
        message: error.message,
        hint: 'Make sure you ran supabase/schema.sql in your Supabase SQL Editor',
      }, { status: 500 });
    }

    return NextResponse.json({
      status: 'connected',
      message: 'Supabase connection successful',
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    });
  } catch {
    return NextResponse.json({
      status: 'error',
      message: 'Failed to connect to Supabase',
    }, { status: 500 });
  }
}
