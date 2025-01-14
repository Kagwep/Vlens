import { useContract, useSendTransaction } from '@starknet-react/core';
import React, { useState } from 'react';
import { LEND_CONTRACT_ADRRESS, LENDABI } from '../constants';
import { Abi } from 'starknet';
import { parseInputAmountToUint256 } from '../utils';

const LendingInterface = () => {
  const [activeTab, setActiveTab] = useState('supply');

  
  const { contract } = useContract({
    address: LEND_CONTRACT_ADRRESS,
    abi: LENDABI as Abi
  });
  
  // Supply form state
  const [supplyForm, setSupplyForm] = useState({
    poolId: '',
    token: '',
    amount: ''
  });

  // Borrow form state
  const [borrowForm, setBorrowForm] = useState({
    poolId: '',
    collateralToken: '',
    borrowToken: '',
    borrowAmount: ''
  });


  const { sendAsync } = useSendTransaction({
    calls: undefined  // This is required even if undefined initially
  });


  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSupply = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Implementation to be added
      console.log('Supply params:', supplyForm);

      

          const calls = [
            {
                // First call: Approve
                contractAddress: "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7", // ETH/WETH address
                entrypoint: "approve",
                calldata: [
                  LEND_CONTRACT_ADRRESS, // address to approve (your wrapper contract)
                  parseInputAmountToUint256(supplyForm.amount).low,
                  parseInputAmountToUint256(supplyForm.amount).high
                ]
              },
            {
              contractAddress: LEND_CONTRACT_ADRRESS,
              entrypoint: "supply",
              calldata: [
                "2198503327643286920898110335698706244522220458610657370981979460625005526824",
                "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
                "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
                parseInputAmountToUint256(supplyForm.amount).low,
                parseInputAmountToUint256(supplyForm.amount).high
              ]
            }
          ];

          const result = await sendAsync(calls);
      
      setSuccess('Supply transaction successful!');
    } catch (err) {
      setError((err as any).message || 'Supply transaction failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBorrow = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Implementation to be added
      console.log('Borrow params:', borrowForm);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess('Borrow transaction successful!');
    } catch (err) {
      setError((err as any).message || 'Borrow transaction failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 text-slate-800">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-center mb-6">Lending Protocol</h1>
            
            {/* Tabs */}
            <div className="flex mb-6">
              <button
                className={`flex-1 py-2 px-4 text-center ${
                  activeTab === 'supply'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                } rounded-l-lg transition-colors`}
                onClick={() => setActiveTab('supply')}
              >
                Supply
              </button>
              <button
                className={`flex-1 py-2 px-4 text-center ${
                  activeTab === 'borrow'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                } rounded-r-lg transition-colors`}
                onClick={() => setActiveTab('borrow')}
              >
                Borrow
              </button>
            </div>

            {/* Supply Form */}
            {activeTab === 'supply' && (
              <form onSubmit={handleSupply} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pool ID
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="Enter pool ID"
                    value={supplyForm.poolId}
                    onChange={(e) => setSupplyForm({...supplyForm, poolId: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Token Address
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="Enter token address"
                    value={supplyForm.token}
                    onChange={(e) => setSupplyForm({...supplyForm, token: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="Enter amount"
                    value={supplyForm.amount}
                    onChange={(e) => setSupplyForm({...supplyForm, amount: e.target.value})}
                    min="0"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-2 px-4 rounded-md text-white font-medium ${
                    isLoading
                      ? 'bg-blue-400 cursor-not-allowed'
                      : 'bg-blue-500 hover:bg-blue-600'
                  } transition-colors`}
                >
                  {isLoading ? 'Processing...' : 'Supply'}
                </button>
              </form>
            )}

            {/* Borrow Form */}
            {activeTab === 'borrow' && (
              <form onSubmit={handleBorrow} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pool ID
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="Enter pool ID"
                    value={borrowForm.poolId}
                    onChange={(e) => setBorrowForm({...borrowForm, poolId: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Collateral Token Address
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="Enter collateral token address"
                    value={borrowForm.collateralToken}
                    onChange={(e) => setBorrowForm({...borrowForm, collateralToken: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Borrow Token Address
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="Enter borrow token address"
                    value={borrowForm.borrowToken}
                    onChange={(e) => setBorrowForm({...borrowForm, borrowToken: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Borrow Amount
                  </label>
                  <input
                    type="number"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="Enter borrow amount"
                    value={borrowForm.borrowAmount}
                    onChange={(e) => setBorrowForm({...borrowForm, borrowAmount: e.target.value})}
                    min="0"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-2 px-4 rounded-md text-white font-medium ${
                    isLoading
                      ? 'bg-blue-400 cursor-not-allowed'
                      : 'bg-blue-500 hover:bg-blue-600'
                  } transition-colors`}
                >
                  {isLoading ? 'Processing...' : 'Borrow'}
                </button>
              </form>
            )}

            {/* Error Message */}
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
                {error}
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-md">
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