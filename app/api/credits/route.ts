import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const wallet = searchParams.get('wallet');

  if (!wallet) {
    return NextResponse.json(
      {
        error: 'wallet missing',
      },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from('users')
    .select('credits, lifetime')
    .eq('address', wallet.toLowerCase())
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      {
        error: error.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    credits: data?.credits || 0,
    lifetime: data?.lifetime || false,
  });
}