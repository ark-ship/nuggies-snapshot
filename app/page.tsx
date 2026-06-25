'use client';
import { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { parseEther } from 'viem';
import { useSendTransaction } from 'wagmi';
import { useEffect } from 'react';

const Footer = () => (
  <div className="mt-16 pt-8 pb-4 text-center border-t border-gray-800/50 w-full">
    <div className="flex justify-center gap-8 mb-4 text-sm font-bold">
      <a href="https://x.com/nuggieseth_" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">𝕏 / TWITTER</a>
      <a href="https://opensea.io/collection/nuggiesnft" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400 transition-colors">🌊 OPENSEA</a>
    </div>
    <p className="text-gray-600 text-[10px] tracking-widest uppercase">© {new Date().getFullYear()} nuggies. all rights reserved.</p>
  </div>
);

export default function Home() {
  const { address, isConnected } = useAccount();
  const { sendTransactionAsync } = useSendTransaction();
  console.log(address);
  const [contract, setContract] = useState('');
  const [chain, setChain] = useState('eth');
  const [loading, setLoading] = useState(false);
  const [collection, setCollection] = useState<any>(null);
  const [holders, setHolders] = useState<any[]>([]);
  const [nfts, setNfts] = useState<any[]>([]);

  const [credits, setCredits] = useState(0);
  const [isLifetime, setIsLifetime] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);

  useEffect(() => {
    const loadCredits = async () => {
      if (!address) return;

      const res = await fetch(
        `/api/credits?wallet=${address}`
      );

      const data = await res.json();

      setCredits(data.credits || 0);
setIsLifetime(data.lifetime || false);
    };

    loadCredits();
  }, [address]);

  const buyCredits = async (
  amount: string,
  creditsAmount: number,
  chainName: string
) => {
  try {
    if (!address) {
      alert('Connect wallet first');
      return;
    }

    const txHash = await sendTransactionAsync({
      to: '0xcac388f8df1c9b50da13c7d80275dec68c4981ff',
      value: parseEther(amount),
    });

    console.log('TX HASH:', txHash);

    const res = await fetch('/api/payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        txHash,
        wallet: address,
        chain: chainName,
      }),
    });

    const data = await res.json();

    console.log(data);

    if (data.error) {
      alert(data.error);
      return;
    }

    alert(`Success! Added ${data.creditsAdded} credits`);

    setCredits((prev) => prev + data.creditsAdded);

    setShowBuyModal(false);
  } catch (err: any) {
    console.error(err);
    alert(err.message);
  }
};

  const handleFetch = async () => {
    if (!isConnected) {
  return alert('Connect wallet first');
}

    if (!contract) return alert('Address is empty, please fill it in');
    setLoading(true);
    setCollection(null);
    setHolders([]);
    setNfts([]);

    try {
      const [snapRes, nftRes] = await Promise.all([
        fetch(
  `/api/snapshot?contract=${contract}&chain=${chain}&wallet=${address}`
),
        fetch(`/api/nfts?contract=${contract}&chain=${chain}`)
      ]);

      const snapJson = await snapRes.json();
      const nftJson = await nftRes.json();

      if (snapJson.error) throw new Error(snapJson.error);

      setCollection(snapJson.collection);
      setHolders(snapJson.holders);
      setNfts(nftJson.nfts || []);
       
      const creditRes = await fetch(
  `/api/credits?wallet=${address}`
);

const creditJson = await creditRes.json();

setCredits(creditJson.credits || 0);

    } catch (error: any) {
      alert('Whoops, error: ' + error.message);
    }
    setLoading(false);
  };

  // Fungsi download langsung dipanggil tanpa MetaMask
  const downloadCsv = () => {
    if (credits <= 0) {
    return alert('No credits remaining');
  }
    if (holders.length === 0) return alert('No data to download bro');
    
    const headers = 'Wallet Address\n';
    const csvData = holders.map((row) => row.wallet).join('\n');
    
    const blob = new Blob([headers + csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${collection?.name || 'snapshot'}-${chain}.csv`;
    a.click();
    
    // Cleanup URL
    window.URL.revokeObjectURL(url);
  };

  return (
    <main className="flex flex-col items-center min-h-screen bg-[#121212] text-white p-6">
      <div className="max-w-6xl w-full flex-1 flex flex-col">
        <div className="text-center mb-10 mt-8">
          
          <div className="flex justify-center mb-6">
    <ConnectButton />
  </div>
          <div className="text-center mb-4">
  <p className="text-gray-400 mb-3">
    Credits: <span className="text-white font-bold">{credits}</span>
  </p>
   {isLifetime && (
  <p className="text-yellow-400 font-bold">
    ⭐ Lifetime Access
  </p>
)}

  {!isLifetime && (
  <button
    onClick={() => setShowBuyModal(true)}
    className="bg-blue-600 hover:bg-blue-500 px-5 py-2 rounded-xl font-bold"
  >
    Buy Credits
  </button>
)}
</div>


          <h1 className="text-4xl font-extrabold mb-2 tracking-tight">nuggies explorer 🔍</h1>
          <p className="text-gray-400">snapshot holders & view collection metadata instantly.</p>
        </div>

        <div className="flex gap-2 max-w-2xl mx-auto mb-10 w-full">
          <select 
            value={chain} 
            onChange={(e) => setChain(e.target.value)}
            className="p-4 rounded-xl bg-[#1e1e1e] border border-gray-700 text-white font-bold"
          >
            <option value="eth">ETH</option>
            <option value="base">BASE</option>
            <option value="abstract">ABS</option>
          </select>
          <input
            type="text"
            placeholder="paste contract address (0x...)"
            className="flex-1 p-4 rounded-xl bg-[#1e1e1e] border border-gray-700 text-white font-mono text-sm"
            value={contract}
            onChange={(e) => setContract(e.target.value)}
          />
          <button
            onClick={handleFetch}
            disabled={loading}
            className="bg-white text-black font-bold px-8 py-4 rounded-xl hover:bg-gray-200 disabled:opacity-50 transition-all"
          >
            {loading ? 'cooking...' : 'explore'}
          </button>
        </div>

        {collection && (
          <div className="animate-fade-in mb-10">
            <div className="flex flex-col md:flex-row justify-between items-center bg-[#1e1e1e] p-6 rounded-2xl border border-gray-800 mb-6">
              <div className="flex items-center gap-4">
                {collection.image ? (
                  <img src={collection.image} alt="nft" className="w-20 h-20 rounded-xl object-cover" />
                ) : (
                  <div className="w-20 h-20 bg-gray-700 rounded-xl flex items-center justify-center text-2xl">🖼️</div>
                )}
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    {collection.name} 
                    <span className="text-[10px] bg-gray-700 px-2 py-1 rounded-full uppercase text-gray-300 tracking-wider">{chain}</span>
                  </h2>
                  <p className="text-gray-400 mt-1">
                    <span className="text-white font-bold">{collection.totalSupply}</span> Supply • <span className="text-white font-bold">{holders.length}</span> Holders
                  </p>
                </div>
              </div>
              
              {/* TOMBOL DOWNLOAD LANGSUNG */}
              <button
                onClick={downloadCsv}
                className="bg-green-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-green-500 transition-all shadow-[0_0_15px_rgba(22,163,74,0.4)]"
              >
                📥 download snapshot (free)
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* KOLOM HOLDERS */}
              <div className="lg:col-span-1 bg-[#1e1e1e] p-6 rounded-2xl border border-gray-800 flex flex-col h-[600px]">
                <h3 className="text-lg font-bold mb-4 border-b border-gray-700 pb-2">Top Holders</h3>
                <div className="overflow-y-auto flex-1 pr-2">
                  <table className="w-full text-sm text-left">
                    <thead className="sticky top-0 bg-[#1e1e1e] z-10">
                      <tr className="text-gray-400 border-b border-gray-800">
                        <th className="pb-2">Wallet</th>
                        <th className="pb-2 text-right">Owned</th>
                      </tr>
                    </thead>
                    <tbody>
                      {holders.map((h, i) => (
                        <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                          <td className="py-3 font-mono text-xs text-gray-300">
                            {h.wallet.slice(0, 6)}...{h.wallet.slice(-4)}
                          </td>
                          <td className="py-3 text-right font-bold text-blue-400">{h.balance}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* KOLOM GALLERY */}
              <div className="lg:col-span-2 bg-[#1e1e1e] p-6 rounded-2xl border border-gray-800 h-[600px] flex flex-col">
                <h3 className="text-lg font-bold mb-4 border-b border-gray-700 pb-2">Collection Previews</h3>
                <div className="overflow-y-auto flex-1">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {nfts.map((nft, i) => (
                      <div key={i} className="bg-[#2a2a2a] rounded-xl overflow-hidden border border-gray-700 hover:border-gray-500 transition-all group">
                        <div className="aspect-square bg-gray-800 relative overflow-hidden">
                          {nft.image ? (
                            <img src={nft.image} alt={nft.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">no image</div>
                          )}
                        </div>
                        <div className="p-3">
                          <p className="font-bold text-sm truncate">{nft.name}</p>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {nft.traits?.slice(0, 2).map((trait: any, idx: number) => (
                              <span key={idx} className="text-[9px] bg-[#3a3a3a] text-gray-300 px-2 py-0.5 rounded border border-gray-600 truncate max-w-[70px]">
                                {String(trait.value || trait)}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showBuyModal && !isLifetime && (
  <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
    <div className="bg-[#1e1e1e] border border-gray-700 rounded-2xl p-6 w-full max-w-md">
      <h2 className="text-2xl font-bold mb-4">
        Buy Credits
      </h2>

      <div className="space-y-3">

        <button
  onClick={() => buyCredits('0.005', 5, chain)}
  className="w-full bg-[#2a2a2a] p-3 rounded-xl"
>
  5 Credits • 0.005 ETH
</button>

        <button
  onClick={() => buyCredits('0.01', 10, chain)}
  className="w-full bg-[#2a2a2a] p-3 rounded-xl"
>
  10 Credits • 0.01 ETH
</button>

        <button
  onClick={() => buyCredits('0.019', 20, chain)}
  className="w-full bg-[#2a2a2a] p-3 rounded-xl"
>
  20 Credits • 0.019 ETH
</button>

        <button
  onClick={() => buyCredits('0.045', 50, chain)}
  className="w-full bg-[#2a2a2a] p-3 rounded-xl"
>
  50 Credits • 0.045 ETH
</button>
        <button
  onClick={() => buyCredits('0.085', 100, chain)}
  className="w-full bg-[#2a2a2a] p-3 rounded-xl"
>
  100 Credits • 0.085 ETH
</button>

        <button
  onClick={() => buyCredits('0.5', 1, chain)}
  className="w-full bg-yellow-600 p-3 rounded-xl font-bold"
>
          Lifetime • 0.5 ETH
        </button>

      </div>

      <button
        onClick={() => setShowBuyModal(false)}
        className="mt-4 w-full bg-red-600 p-3 rounded-xl"
      >
        Close
      </button>
    </div>
  </div>
)}

      <Footer />
    </main>
  );
}