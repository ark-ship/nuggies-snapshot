import { NextResponse } from 'next/server';
import { Alchemy, Network } from 'alchemy-sdk';

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

  if (!contract) {
    return NextResponse.json({ error: 'contract address is missing bro' }, { status: 400 });
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
        imageUrl = resolveImage(
          firstNft.nfts[0].image?.cachedUrl || 
          firstNft.nfts[0].rawMetadata?.image as string
        );
      }
    }
    
    let owners: any[] = [];
    let pageKey: string | undefined = undefined;

    // fetch all holders using pagination
    do {
      const response = await alchemy.nft.getOwnersForContract(contract, {
        withTokenBalances: true,
        pageKey,
      });
      owners = owners.concat(response.owners);
      pageKey = response.pageKey;
    } while (pageKey);

    // calculate total token balance per wallet
    const cleanData = owners.map((owner) => {
      const totalBalance = owner.tokenBalances.reduce((sum, token) => {
        return sum + (Number(token.balance) || 0);
      }, 0);

      return {
        wallet: owner.ownerAddress,
        balance: totalBalance,
      };
    });

    // sort from highest holder (whale) to lowest
    cleanData.sort((a, b) => b.balance - a.balance);

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