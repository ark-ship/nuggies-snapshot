import { NextResponse } from 'next/server';
import { Alchemy, Network } from 'alchemy-sdk';
import { supabase } from '@/lib/supabase';

const TREASURY = '0xcac388f8df1c9b50da13c7d80275dec68c4981ff';

const PACKAGES = [
  { credits: 5, amount: 0.005 },
  { credits: 10, amount: 0.01 },
  { credits: 20, amount: 0.019 },
  { credits: 50, amount: 0.045 },
  { credits: 100, amount: 0.085 },
];

export async function POST(request: Request) {
  try {
    const { txHash, wallet, chain } = await request.json();

    console.log('PAYMENT REQUEST');
    console.log({ txHash, wallet, chain });

    if (!txHash || !wallet || !chain) {
      return NextResponse.json(
        { error: 'missing params' },
        { status: 400 }
      );
    }

    const { data: alreadyUsed, error: paymentCheckError } =
      await supabase
        .from('payments')
        .select('*')
        .eq('tx_hash', txHash)
        .maybeSingle();

    if (paymentCheckError) {
      console.log('PAYMENT CHECK ERROR');
      console.log(paymentCheckError);
    }

    if (alreadyUsed) {
      return NextResponse.json(
        { error: 'tx already claimed' },
        { status: 400 }
      );
    }

    const network =
      chain === 'base'
        ? Network.BASE_MAINNET
        : Network.ETH_MAINNET;

    const alchemy = new Alchemy({
      apiKey: process.env.ALCHEMY_API_KEY,
      network,
    });

    const tx = await alchemy.core.getTransaction(txHash);

    console.log('TX DATA');
    console.log(tx);

    if (!tx) {
      return NextResponse.json(
        { error: 'tx not found' },
        { status: 404 }
      );
    }

    if (!tx.to) {
      return NextResponse.json(
        { error: 'invalid tx' },
        { status: 400 }
      );
    }

    if (
      tx.to.toLowerCase() !==
      TREASURY.toLowerCase()
    ) {
      return NextResponse.json(
        { error: 'wrong destination wallet' },
        { status: 400 }
      );
    }
    
    const LIFETIME_PRICE = 0.5;

    const ethPaid = Number(tx.value) / 1e18;

    const isLifetime =
  Math.abs(ethPaid - LIFETIME_PRICE) < 0.000001;

    console.log('ETH PAID:', ethPaid);

    const matchedPackage = PACKAGES.find(
      (p) => Math.abs(p.amount - ethPaid) < 0.000001
    );

    if (!matchedPackage && !isLifetime) {
  return NextResponse.json(
    { error: 'invalid payment amount' },
    { status: 400 }
  );
}

    const packageData = matchedPackage;

    const address = wallet.toLowerCase();

    const { data: user, error: userError } =
      await supabase
        .from('users')
        .select('*')
        .eq('address', address)
        .maybeSingle();

    if (userError) {
      console.log('USER QUERY ERROR');
      console.log(userError);

      return NextResponse.json(
        {
          error: userError.message,
        },
        { status: 500 }
      );
    }

    if (!user) {
  const { error: insertUserError } =
    await supabase.from('users').insert({
      address,
      credits: matchedPackage?.credits || 0,
      lifetime: isLifetime,
    });

  if (insertUserError) {
    console.log('INSERT USER ERROR');
    console.log(insertUserError);

    return NextResponse.json(
      {
        error: insertUserError.message,
      },
      { status: 500 }
    );
  }
} else {
  let updateData: any = {};

  if (isLifetime) {
    updateData.lifetime = true;
  } else {
    updateData.credits =
      (user.credits || 0) +
      (matchedPackage?.credits || 0);
  }

  const { error: updateError } =
    await supabase
      .from('users')
      .update(updateData)
      .eq('address', address);

  if (updateError) {
    console.log('UPDATE USER ERROR');
    console.log(updateError);

    return NextResponse.json(
      {
        error: updateError.message,
      },
      { status: 500 }
    );
  }
}

    const { error: paymentInsertError } =
      await supabase.from('payments').insert({
        tx_hash: txHash,
        wallet: address,
        credits_added: packageData!.credits,
        chain,
      });

    if (paymentInsertError) {
      console.log('PAYMENT INSERT ERROR');
      console.log(paymentInsertError);

      return NextResponse.json(
        {
          error: paymentInsertError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
  success: true,
  creditsAdded: matchedPackage?.credits || 0,
  lifetime: isLifetime,
});

  } catch (error: any) {
    console.error('PAYMENT ERROR');
    console.error(error);

    return NextResponse.json(
      {
        error: error?.message || 'verification failed',
      },
      { status: 500 }
    );
  }
}