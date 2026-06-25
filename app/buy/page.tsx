'use client';

import { useSendTransaction, useAccount } from 'wagmi';
import { parseEther } from 'viem';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const packages = [
  { credits: 5, price: '0.005', label: 'Starter' },
  { credits: 10, price: '0.01', label: 'Pro', discount: 'Best Value' },
  { credits: 20, price: '0.019', label: 'Expert', discount: 'Save 5%' },
  { credits: 50, price: '0.045', label: 'Master', discount: 'Save 10%' },
  { credits: 100, price: '0.085', label: 'Whale', discount: 'Save 15%' },
  { credits: 999, price: '0.5', label: 'Unlimited', discount: 'LIFETIME' },
];

export default function BuyCredits() {
  const { isConnected } = useAccount();
  const { sendTransaction } = useSendTransaction();

  // Pastikan di .env.local kamu namanya: NEXT_PUBLIC_TREASURY_WALLET_ADDRESS
  const treasuryAddress = process.env.NEXT_PUBLIC_TREASURY_WALLET_ADDRESS as `0x${string}`;

  const handleBuy = (price: string) => {
    if (!treasuryAddress) {
      alert("Error: Treasury wallet belum di-set di .env");
      return;
    }
    sendTransaction({
      to: treasuryAddress,
      value: parseEther(price),
    });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 flex flex-col items-center">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold mb-2">Pick Your Plan 🚀</h1>
        <ConnectButton />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl">
        {packages.map((pkg) => (
          <div key={pkg.credits} className="bg-[#161616] p-6 rounded-2xl border border-gray-800 hover:border-white transition-all">
            {pkg.discount && (
              <span className="text-[10px] bg-white text-black px-2 py-0.5 rounded-full font-bold mb-2 inline-block">
                {pkg.discount}
              </span>
            )}
            <h2 className="text-xl font-bold">{pkg.credits === 999 ? 'UNLIMITED' : pkg.credits + ' Credits'}</h2>
            <p className="text-3xl font-bold my-4">{pkg.price} ETH</p>
            
            <button
              onClick={() => isConnected ? handleBuy(pkg.price) : alert("Connect Wallet dulu bro!")}
              className={`w-full font-bold py-3 rounded-xl transition-colors ${
                isConnected 
                ? 'bg-white text-black hover:bg-gray-300' 
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isConnected ? 'Buy Now' : 'Connect Wallet to Buy'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}