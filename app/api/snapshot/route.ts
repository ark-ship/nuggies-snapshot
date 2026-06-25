import { NextResponse } from 'next/server';
import { Alchemy, Network } from 'alchemy-sdk';
import { supabase } from '@/lib/supabase';

const resolveImage = (url: string | undefined) => {
  if (!url) return '';
  if (url.startsWith('ipfs://')) {
    return url.replace('ipfs://', 'https://ipfs.io/ipfs/');
  }
  return url;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const contract = searchParams.get('contract');
  const chain = searchParams.get('chain') || 'eth';

  const wallet = searchParams.get('wallet');

if (!wallet) {
  return NextResponse.json(
    { error: 'connect wallet first' },
    { status: 401 }
  );
}


  if (!contract) {
    return NextResponse.json({ error: 'contract address is missing' }, { status: 400 });
  }
  
  const { data: user } = await supabase
  .from('users')
  .select('*')
  .eq('address', wallet.toLowerCase())
  .single();

if (!user) {
  return NextResponse.json(
    { error: 'no credits found' },
    { status: 403 }
  );
}

if (!user?.lifetime && (user?.credits || 0) <= 0) {
  return NextResponse.json(
    { error: 'out of credits bro' },
    { status: 403 }
  );
}
  // network selection logic
  let network;
  if (chain === 'base') {
    network = Network.BASE_MAINNET;
  } else if (chain === 'abstract') {
    network = Network.ABSTRACT_MAINNET;
  } else {
    network = Network.ETH_MAINNET;
  }

  const config = {
    apiKey: process.env.ALCHEMY_API_KEY,
    network: network,
  };
  const alchemy = new Alchemy(config);

  try {
    const metadata: any = await alchemy.nft.getContractMetadata(contract).catch(() => ({}));
    let imageUrl = resolveImage(metadata?.openSea?.imageUrl);
    // fallback: if opensea image is empty, grab the first NFT's image
    if (!imageUrl) {
      const firstNft = await alchemy.nft.getNftsForContract(contract, { pageSize: 1 }).catch(() => ({ nfts: [] }));
      if (firstNft.nfts && firstNft.nfts.length > 0) {
        const firstData: any = firstNft.nfts[0]; // kita kasih any biar typescript tutup mata
        imageUrl = resolveImage(
          firstData.image?.cachedUrl || 
          firstData.rawMetadata?.image ||
          firstData.raw?.metadata?.image
        );
      }
    }
    
    let owners: any[] = [];
    let pageKey: string | undefined = undefined;

    // fetch all holders using pagination
    do {
      const response: any = await alchemy.nft.getOwnersForContract(contract, {
        withTokenBalances: true,
        pageKey,
      });
      owners = owners.concat(response.owners);
      pageKey = response.pageKey;
    } while (pageKey);

    // calculate total token balance per wallet
    const cleanData = owners.map((owner: any) => {
      const totalBalance = owner.tokenBalances.reduce((sum: number, token: any) => {
        return sum + (Number(token.balance) || 0);
      }, 0);

      return {
        wallet: owner.ownerAddress,
        balance: totalBalance,
      };
    });

    // sort from highest holder (whale) to lowest
    cleanData.sort((a, b) => b.balance - a.balance);

if (!user?.lifetime) {
  await supabase
    .from('users')
    .update({
      credits: Math.max(
        0,
        (user.credits || 0) - 1
      ),
    })
    .eq('address', wallet.toLowerCase());
}

return NextResponse.json({
      collection: {
        name: metadata.name || 'Unknown Collection',
        image: imageUrl || '', 
        totalSupply: metadata.totalSupply || cleanData.reduce((acc, curr) => acc + curr.balance, 0)
      },
      holders: cleanData 
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: `failed to fetch data from ${chain} chain, make sure the address is correct bro` }, { status: 500 });
  }
}