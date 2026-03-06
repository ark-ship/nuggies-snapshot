import { NextResponse } from 'next/server';
import { Alchemy, Network } from 'alchemy-sdk';

const resolveImage = (url: string | undefined) => {
  if (!url) return '';
  if (url.startsWith('ipfs://')) return url.replace('ipfs://', 'https://ipfs.io/ipfs/');
  return url;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const contract = searchParams.get('contract');
  const chain = searchParams.get('chain') || 'eth';

  if (!contract) return NextResponse.json({ error: 'contract address is missing bro' }, { status: 400 });

  let network = Network.ETH_MAINNET;
  if (chain === 'base') network = Network.BASE_MAINNET;
  else if (chain === 'abstract') network = Network.ABSTRACT_MAINNET;

  const alchemy = new Alchemy({ apiKey: process.env.ALCHEMY_API_KEY, network });

  try {
    // fetch only the first 100 NFTs for the preview gallery to keep it lightweight
    const response = await alchemy.nft.getNftsForContract(contract, { pageSize: 100 });
    
    const cleanNfts = response.nfts.map((nft: any) => {
      // hunt for traits across different possible metadata paths
      const meta = nft.raw?.metadata || nft.rawMetadata || {};
      const attributes = meta.attributes || meta.traits || [];

      return {
        id: nft.tokenId,
        name: nft.name || `NFT #${nft.tokenId}`,
        image: resolveImage(nft.image?.cachedUrl || meta.image),
        traits: Array.isArray(attributes) ? attributes : [],
      };
    });

    return NextResponse.json({ nfts: cleanNfts });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'failed to fetch nft images' }, { status: 500 });
  }
}