import { createClient } from '@vercel/kv';
import { NextResponse } from 'next/server';

const kv = createClient({
  url: "https://redis-18505.c281.us-east-1-2.ec2.cloud.redislabs.com",
  token: "D2SsBiMXw67pjxUkzibHm2Y9cRBxOWa2",
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get('wallet')?.toLowerCase();
    const contract = searchParams.get('contract')?.toLowerCase();
    const chain = searchParams.get('chain');

    if (!wallet || !contract || !chain) {
      return NextResponse.json({ error: 'Missing params' }, { status: 400 });
    }

    const key = `paid_${wallet}_${contract}_${chain}`;
    const hasPaid = await kv.get(key);

    return NextResponse.json({ hasPaid: !!hasPaid });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { wallet, contract, chain } = body;

    const key = `paid_${wallet.toLowerCase()}_${contract.toLowerCase()}_${chain}`;
    
    await kv.set(key, true);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}