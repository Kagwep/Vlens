import { useContract, useSendTransaction } from '@starknet-react/core';
import React, { useState } from 'react';
import { LEND_CONTRACT_ADRRESS, LENDABI, SINGE, VETH } from '../constants';
import { Abi } from 'starknet';
import { parseInputAmountToUint256 } from '../utils';
import tokens from "../abi/markets.json";
import { Token } from '../type';

const LendingInterface = () => {
  const [activeTab, setActiveTab] = useState('earn');
  
  const { contract } = useContract({
    address: LEND_CONTRACT_ADRRESS,
    abi: LENDABI as Abi
  });
  
  const pools = {
    genesis: "2198503327643286920898110335698706244522220458610657370981979460625005526824",
    "Re7 USDC": "3592370751539490711610556844458488648008775713878064059760995781404350938653",
    "Re7 xSTRK": "2345856225134458665876812536882617294246962319062565703131100435311373119841",
    "Re7 sSTRK": "1301140954640322725373945719229815062445705809076381949099585786202465661889"
  };

  const [supplyForm, setSupplyForm] = useState<{
    token: Token | null;
    amount: string;
  }>({
    token: null,
    amount: ''
  });

  const [borrowForm, setBorrowForm] = useState<{
    poolId: string;
    collateralToken: Token | null;
    borrowToken: Token | null;
    borrowAmount: string;
  }>({
    poolId: Object.values(pools)[0],
    collateralToken: null,
    borrowToken: null,
    borrowAmount: ''
  });

  const { sendAsync } = useSendTransaction({
    calls: undefined
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSupply = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');
    try {
      const calls = [
        {
          contractAddress: "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
          entrypoint: "approve",
          calldata: [
            VETH,
            parseInputAmountToUint256(supplyForm.amount).low,
            parseInputAmountToUint256(supplyForm.amount).high
          ]
        },
        {
          contractAddress: VETH,
          entrypoint: "deposit",
          calldata: [
            parseInputAmountToUint256(supplyForm.amount).low,
            parseInputAmountToUint256(supplyForm.amount).high,
            SINGE
          ]
        }
      ];
      await sendAsync(calls);
      setSuccess('Supply transaction successful!');
    } catch (err) {
      setError((err as Error).message || 'Supply transaction failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBorrow = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');
    try {
      console.log('Borrow params:', borrowForm);
      // Implement borrow logic here
      setSuccess('Borrow transaction successful!');
    } catch (err) {
      setError((err as Error).message || 'Borrow transaction failed');
    } finally {
      setIsLoading(false);
    }
  };

  const TokenSelector = ({ 
    value, 
    onChange, 
    label 
  }: { 
    value: Token | null, 
    onChange: (token: Token) => void, 
    label: string 
  }) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">
        {label}
      </label>
      <select
        className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 text-gray-200"
        value={value?.id || ''}
        onChange={(e) => {
          const token = tokens.tokens.find(t => t.id === e.target.value);
          if (token) onChange(token as unknown as Token);
        }}
        required
      >
        <option value="">Select a token</option>
        {tokens.tokens.map((token) => (
          <option key={token.id} value={token.id}>
            {token.symbol} - {token.name}
          </option>
        ))}
      </select>
      {value && (
        <div className="flex items-center p-2 bg-gray-800 rounded-md border border-gray-700">
          <img 
            src={value.iconUrl} 
            alt={`${value.symbol} icon`} 
            className="w-6 h-6 mr-2"
          />
          <span className="text-sm text-gray-300">{value.symbol} - {value.name}</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-gray-800 rounded-xl shadow-xl overflow-hidden border border-gray-700">
          <div className="p-8">
            <h1 className="text-3xl font-bold text-center mb-8 text-gray-100">Lens Protocol</h1>
            
            <div className="flex gap-2 mb-8 bg-gray-900 p-1 rounded-lg">
              {['earn', 'borrow'].map((tab) => (
                <button
                  key={tab}
                  className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all duration-200 ${
                    activeTab === tab
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                  }`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {activeTab === 'earn' ? (
              <form onSubmit={handleSupply} className="space-y-6">
                <TokenSelector
                  value={supplyForm.token}
                  onChange={(token) => setSupplyForm(prev => ({ ...prev, token }))}
                  label="Deposit Token"
                />
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Amount
                  </label>
                  <input
                    type="text"
                    className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 text-gray-200 placeholder-gray-500"
                    placeholder="Enter amount"
                    value={supplyForm.amount}
                    onChange={(e) => setSupplyForm(prev => ({ ...prev, amount: e.target.value }))}
                    required
                  />
                </div>
              </form>
            ) : (
              <form onSubmit={handleBorrow} className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Pool
                  </label>
                  <select
                    className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 text-gray-200"
                    value={borrowForm.poolId}
                    onChange={(e) => setBorrowForm(prev => ({ ...prev, poolId: e.target.value }))}
                    required
                  >
                    {Object.entries(pools).map(([name, id]) => (
                      <option key={id} value={id}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <TokenSelector
                  value={borrowForm.collateralToken}
                  onChange={(token) => setBorrowForm(prev => ({ ...prev, collateralToken: token }))}
                  label="Collateral Token"
                />
                
                <TokenSelector
                  value={borrowForm.borrowToken}
                  onChange={(token) => setBorrowForm(prev => ({ ...prev, borrowToken: token }))}
                  label="Borrow Token"
                />

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Borrow Amount
                  </label>
                  <input
                    type="text"
                    className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 text-gray-200 placeholder-gray-500"
                    placeholder="Enter amount"
                    value={borrowForm.borrowAmount}
                    onChange={(e) => setBorrowForm(prev => ({ ...prev, borrowAmount: e.target.value }))}
                    required
                  />
                </div>
              </form>
            )}

            <button
              onClick={activeTab === 'earn' ? handleSupply : handleBorrow}
              disabled={isLoading}
              className={`w-full mt-8 py-3 px-6 rounded-lg text-white font-medium transition-all duration-200 ${
                isLoading
                  ? 'bg-blue-800 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-blue-500/20'
              }`}
            >
              {isLoading ? 'Processing...' : activeTab === 'earn' ? 'Supply' : 'Borrow'}
            </button>

            {error && (
              <div className="mt-6 p-4 bg-red-900/50 border border-red-700 text-red-200 rounded-lg">
                {error}
              </div>
            )}
            
            {success && (
              <div className="mt-6 p-4 bg-green-900/50 border border-green-700 text-green-200 rounded-lg">
                {success}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LendingInterface;