'use client';
import { useState } from 'react';

// footer component stays intact
const Footer = () => (
  <div className="mt-16 pt-8 pb-4 text-center border-t border-gray-800/50 w-full">
    <div className="flex justify-center gap-8 mb-4 text-sm font-bold">
      <a 
        href="https://x.com/nuggieseth_" 
        target="_blank" 
        rel="noopener noreferrer" 
        className="text-gray-400 hover:text-white transition-colors"
      >
        𝕏 / TWITTER
      </a>
      <a 
        href="https://opensea.io/collection/nuggiesnft/overview" 
        target="_blank" 
        rel="noopener noreferrer" 
        className="text-gray-400 hover:text-blue-400 transition-colors"
      >
        🌊 OPENSEA
      </a>
    </div>
    <p className="text-gray-600 text-[10px] tracking-widest uppercase">
      © {new Date().getFullYear()} nuggies. all rights reserved.
    </p>
  </div>
);

export default function Home() {
  const [contract, setContract] = useState('');
  const [chain, setChain] = useState('eth');
  const [loading, setLoading] = useState(false);
  const [collection, setCollection] = useState<any>(null);
  const [holders, setHolders] = useState<any[]>([]);
  const [nfts, setNfts] = useState<any[]>([]);

  const handleFetch = async () => {
    if (!contract) return alert('address is empty bro, please fill it in');
    setLoading(true);
    setCollection(null);
    setHolders([]);
    setNfts([]);

    try {
      // hitting both APIs simultaneously for speed
      const [snapRes, nftRes] = await Promise.all([
        fetch(`/api/snapshot?contract=${contract}&chain=${chain}`),
        fetch(`/api/nfts?contract=${contract}&chain=${chain}`)
      ]);

      const snapJson = await snapRes.json();
      const nftJson = await nftRes.json();

      if (snapJson.error) throw new Error(snapJson.error);

      setCollection(snapJson.collection);
      setHolders(snapJson.holders);
      setNfts(nftJson.nfts || []);
    } catch (error: any) {
      alert('whoops error bro: ' + error.message);
    }
    
    setLoading(false);
  };

  const downloadCsv = () => {
    if (holders.length === 0) return;
    
    // just the header for wallet
    const headers = 'Wallet Address\n';
    
    // map only the wallet address, ignore the balance
    const csvData = holders.map((row) => row.wallet).join('\n');
    
    const blob = new Blob([headers + csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${collection?.name || 'snapshot'}-${chain}-addresses-only.csv`;
    a.click();
  };

  return (
    <main className="flex flex-col items-center min-h-screen bg-[#121212] text-white p-6">
      <div className="max-w-6xl w-full flex-1 flex flex-col">
        {/* HEADER */}
        <div className="text-center mb-10 mt-8">
          <h1 className="text-4xl font-extrabold mb-2 tracking-tight">nuggies explorer 🔍</h1>
          <p className="text-gray-400">snapshot holders & view collection metadata instantly.</p>
        </div>

        {/* SEARCH BAR */}
        <div className="flex gap-2 max-w-2xl mx-auto mb-10 w-full">
          <select 
            value={chain} 
            onChange={(e) => setChain(e.target.value)}
            className="p-4 rounded-xl bg-[#1e1e1e] border border-gray-700 focus:outline-none focus:border-white text-white cursor-pointer font-bold"
          >
            <option value="eth">ETH</option>
            <option value="base">BASE</option>
            <option value="abstract">ABS</option>
          </select>
          <input
            type="text"
            placeholder="paste contract address (0x...)"
            className="flex-1 p-4 rounded-xl bg-[#1e1e1e] border border-gray-700 focus:outline-none focus:border-white text-white font-mono text-sm"
            value={contract}
            onChange={(e) => setContract(e.target.value)}
          />
          <button
            onClick={handleFetch}
            disabled={loading}
            className="bg-white text-black font-bold px-8 py-4 rounded-xl hover:bg-gray-200 disabled:opacity-50 transition-all whitespace-nowrap"
          >
            {loading ? 'cooking...' : 'explore'}
          </button>
        </div>

        {/* RESULTS SECTION */}
        {collection && (
          <div className="animate-fade-in mb-10">
            {/* TOP BAR: INFO & SNAPSHOT BUTTON */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-[#1e1e1e] p-6 rounded-2xl border border-gray-800 mb-6">
              <div className="flex items-center gap-4 mb-4 md:mb-0">
                {collection.image ? (
                  <img src={collection.image} alt="nft" className="w-20 h-20 rounded-xl object-cover" />
                ) : (
                  <div className="w-20 h-20 bg-gray-700 rounded-xl flex items-center justify-center text-2xl">🖼️</div>
                )}
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    {collection.name} 
                    <span className="text-[10px] bg-gray-700 px-2 py-1 rounded-full uppercase text-gray-300 font-bold tracking-wider">{chain}</span>
                  </h2>
                  <p className="text-gray-400 mt-1">
                    <span className="text-white font-bold">{collection.totalSupply}</span> Supply • <span className="text-white font-bold">{holders.length}</span> Holders
                  </p>
                </div>
              </div>
              <button
                onClick={downloadCsv}
                className="bg-blue-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-blue-500 transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)]"
              >
                📸 take snapshot
              </button>
            </div>

            {/* MAIN CONTENT: 2 COLUMNS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* LEFT COLUMN: HOLDERS LIST */}
              <div className="lg:col-span-1 bg-[#1e1e1e] p-6 rounded-2xl border border-gray-800 flex flex-col h-[600px]">
                <h3 className="text-lg font-bold mb-4 border-b border-gray-700 pb-2">Top Holders</h3>
                <div className="overflow-y-auto flex-1 pr-2 custom-scrollbar">
                  <table className="w-full text-sm text-left">
                    <thead className="sticky top-0 bg-[#1e1e1e] z-10">
                      <tr className="text-gray-400 border-b border-gray-800">
                        <th className="pb-2">Wallet</th>
                        <th className="pb-2 text-right">Owned</th>
                      </tr>
                    </thead>
                    <tbody>
                      {holders.map((h, i) => (
                        <tr key={i} className="border-b border-gray-800/50 last:border-0 hover:bg-gray-800/30 transition-colors">
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

              {/* RIGHT COLUMN: NFT GALLERY WITH TRAITS */}
              <div className="lg:col-span-2 bg-[#1e1e1e] p-6 rounded-2xl border border-gray-800 h-[600px] flex flex-col">
                <h3 className="text-lg font-bold mb-4 border-b border-gray-700 pb-2">Collection Previews</h3>
                <div className="overflow-y-auto flex-1 pr-2 custom-scrollbar">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {nfts.map((nft, i) => (
                      <div key={i} className="bg-[#2a2a2a] rounded-xl overflow-hidden border border-gray-700 hover:border-gray-500 transition-all group">
                        <div className="aspect-square bg-gray-800 overflow-hidden relative">
                          {nft.image ? (
                            <img src={nft.image} alt={nft.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500">no image</div>
                          )}
                        </div>
                        <div className="p-3">
                          <p className="font-bold text-sm truncate">{nft.name}</p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {/* showing max 3 traits so the box doesn't get too long */}
                            {nft.traits?.slice(0, 3).map((trait: any, idx: number) => {
                              // sometimes metadata is just a string, sometimes an object
                              const traitValue = trait.value !== undefined ? trait.value : trait;
                              return (
                                <span key={idx} className="text-[10px] bg-[#3a3a3a] border border-gray-600 text-gray-200 px-2 py-1 rounded-md truncate max-w-[80px] font-medium">
                                  {String(traitValue)}
                                </span>
                              );
                            })}
                            {nft.traits?.length > 3 && (
                              <span className="text-[10px] text-gray-500 font-medium px-1 py-1">
                                +{nft.traits.length - 3}
                              </span>
                            )}
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
      <Footer />
    </main>
  );
}