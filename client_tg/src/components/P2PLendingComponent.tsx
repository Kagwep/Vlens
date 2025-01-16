// components/P2PLendingInterface.tsx
import React, { useState, useEffect } from 'react';
import { useVesuP2P } from '../hooks/useVesuP2P';
import { useAccount } from '@starknet-react/core';
import { Position } from '../type';


export function P2PLendingInterface() {
  const { address } = useAccount();
  const { 
    createLendingOffer, 
    acceptLendingOffer, 
    getPositions, 
    getAssetPrice,
    loading,
    error,
    ASSETS 
  } = useVesuP2P();

  // Form states
  const [amount, setAmount] = useState('');
  const [collateral, setCollateral] = useState('');
  const [selectedLendAsset, setSelectedLendAsset] = useState(ASSETS.USDC);
  const [selectedCollateralAsset, setSelectedCollateralAsset] = useState(ASSETS.ETH);
  const [interestRate, setInterestRate] = useState('5'); // 5% default
  
  // User position state
  const [userPosition, setUserPosition] = useState<Position | null>(null);

  // Load user position
  useEffect(() => {
    if (address) {
      loadUserPosition();
    }
  }, [address, selectedLendAsset, selectedCollateralAsset]);

  const loadUserPosition = async () => {
    const position = await getPositions(address as `0x${string}`, selectedCollateralAsset, selectedLendAsset);
    setUserPosition(position);
  };

  const handleCreateOffer = async () => {
    try {
      await createLendingOffer(
        Number(amount),
        Number(collateral),
        Number(interestRate),
        selectedLendAsset,
        selectedCollateralAsset
      );
      // Reset form
      setAmount('');
      setCollateral('');
      // Reload position
      loadUserPosition();
    } catch (err) {
      console.error("Error creating offer:", err);
    }
  };

  return (
<div className="max-w-2xl mx-auto p-4 bg-slate-900 rounded-lg shadow-xl">
      <h1 className="text-2xl font-bold mb-6 text-slate-100">P2P Lending on Vesu</h1>
      
      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* Lend Asset Selection */}
        <div>
          <label className="block text-sm font-medium mb-1 text-slate-300">Asset to Lend</label>
          <select 
            value={selectedLendAsset} 
            onChange={(e) => setSelectedLendAsset(e.target.value)}
            className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          >
            <option value={ASSETS.USDC}>USDC</option>
            <option value={ASSETS.USDT}>USDT</option>
            <option value={ASSETS.ETH}>ETH</option>
            <option value={ASSETS.WBTC}>WBTC</option>
            <option value={ASSETS.wstETH}>wstETH</option>
            <option value={ASSETS.STRK}>STRK</option>
          </select>
        </div>

        {/* Amount Input */}
        <div>
          <label className="block text-sm font-medium mb-1 text-slate-300">Amount to Lend</label>
          <input 
            type="number" 
            value={amount} 
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          />
        </div>

        {/* Interest Rate Input */}
        <div>
          <label className="block text-sm font-medium mb-1 text-slate-300">Interest Rate (%)</label>
          <input 
            type="number" 
            value={interestRate} 
            onChange={(e) => setInterestRate(e.target.value)}
            placeholder="Enter interest rate"
            className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          />
        </div>

        {/* Collateral Asset Selection */}
        <div>
          <label className="block text-sm font-medium mb-1 text-slate-300">Required Collateral Asset</label>
          <select 
            value={selectedCollateralAsset} 
            onChange={(e) => setSelectedCollateralAsset(e.target.value)}
            className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          >
            <option value={ASSETS.ETH}>ETH</option>
            <option value={ASSETS.WBTC}>WBTC</option>
            <option value={ASSETS.wstETH}>wstETH</option>
          </select>
        </div>

        {/* Collateral Amount Input */}
        <div>
          <label className="block text-sm font-medium mb-1 text-slate-300">Required Collateral Amount</label>
          <input 
            type="number"
            value={collateral}
            onChange={(e) => setCollateral(e.target.value)}
            placeholder="Collateral amount"
            className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          />
        </div>

        {/* Submit Button */}
        <button 
          onClick={handleCreateOffer}
          disabled={loading || !amount || !collateral}
          className={`w-full p-2 rounded text-white transition-colors duration-200 ${
            loading || !amount || !collateral 
              ? 'bg-slate-700 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? 'Processing...' : 'Create Lending Offer'}
        </button>

        {/* Position Display */}
        {userPosition && (
          <div className="mt-6 p-4 border border-slate-700 rounded bg-slate-800/50">
            <h2 className="text-lg font-semibold mb-2 text-slate-100">Your Position</h2>
            <div className="space-y-2 text-slate-300">
              <p>Collateral Shares: {userPosition.collateral_shares}</p>
              <p>Nominal Debt: {userPosition.nominal_debt}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}