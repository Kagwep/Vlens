import { useCallback, useEffect, useState } from 'react';
import { useContract, useReadContract, useSendTransaction } from '@starknet-react/core';
import { Abi, Contract, number, uint256 } from 'starknet';
import { SINGLETON_ABI } from '../constants';
import { useGlobalContext } from '../provider/GlobalContext';

const SINGLETON_ADDRESS = '0x2545b2e5d519fc230e9cd781046d3a64e092114f07e44771e0d719d148725ef';
const STRK_ADDRESS = '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d';
const POOL_ID = '2198503327643286920898110335698706244522220458610657370981979460625005526824';

export default function SupplyComponent() {
  const [amount, setAmount] = useState('');
  const [position, setPosition] = useState({ collateral: '0', debt: '0' });
  const [loading, setLoading] = useState(false);
  const { account} = useGlobalContext();

  const { contract } = useContract({
    address: SINGLETON_ADDRESS,
    abi: SINGLETON_ABI as Abi
  });

  const { data: positionData } = useReadContract({
    functionName: 'position',
    abi: SINGLETON_ABI as Abi,
    address: SINGLETON_ADDRESS,
    args: [
      POOL_ID,
      STRK_ADDRESS,
      STRK_ADDRESS,
      account?.address
    ],
    watch: true
  });



  console.log(positionData)

  const { sendAsync } = useSendTransaction({
    calls: undefined  // This is required even if undefined initially
  });

  const handleSupply = useCallback(async () => {
    if (!amount || !contract) return;

    setLoading(true);
    try {
      const amountBn = uint256.bnToUint256(amount);
      
      
      const params = [
        POOL_ID,
        STRK_ADDRESS,
        "0x0",
        account?.address, // Connected wallet address
        {
          amount_type: {
            Delta: {}
          }, // Delta
          denomination: {
            Native: {}
          }, // Native
          value: amountBn
        },
        {
          amount_type: {
                Delta: {}
            },
            denomination: {
                Native: {}
            },
          value: { low: 0, high: 0 }
        },
         []
    ];

    console.log(contract, params)

    const mycall = contract.populate("modify_position", params);

    console.log(mycall)

    const calls = [
    {
        contractAddress: SINGLETON_ADDRESS,
        entrypoint: "modify_position",
        calldata:mycall.calldata
    }
    ];

      await sendAsync(calls);

      setAmount('');
    } catch (error) {
      console.error('Supply failed:', error);
    } finally {
      setLoading(false);
    }
  }, [amount, contract, sendAsync]);

  const handlePercentageClick = (percentage: number) => {
    setAmount((1000 * percentage / 100).toString());
  };

  return (
    <div className="bg-gray-900 rounded-lg p-6 max-w-lg w-full">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white">Supply STRK</h2>
      </div>

      {/* Input Section */}
      <div className="space-y-6">
        <div className="relative">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="absolute right-3 top-3 text-gray-500">
            <span>STRK</span>
          </div>
        </div>

        {/* Percentage Buttons */}
        <div className="grid grid-cols-4 gap-2">
          {[25, 50, 75, 100].map((percentage) => (
            <button
              key={percentage}
              onClick={() => handlePercentageClick(percentage)}
              className="bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 rounded-lg text-sm transition-colors"
            >
              {percentage}%
            </button>
          ))}
        </div>

        {/* Position Info */}
        <div className="space-y-3 bg-gray-800 rounded-lg p-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Current Position</span>
            <span className="text-white">{position.collateral} STRK</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Supply APY</span>
            <div className="flex items-center">
              <span className="text-white">4.479%</span>
              {/* You can add tooltips or info icons here */}
            </div>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Monthly yield</span>
            <span className="text-white">$0.00</span>
          </div>
        </div>

        {/* Supply Button */}
        <button
          onClick={handleSupply}
          disabled={loading || !amount}
          className={`w-full py-3 rounded-lg text-white font-medium transition-colors
            ${loading || !amount 
              ? 'bg-gray-700 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              Supplying...
            </span>
          ) : (
            'Start earning'
          )}
        </button>
      </div>

      {/* Additional Details Button */}
      <button className="mt-4 w-full text-center text-gray-400 text-sm hover:text-white transition-colors">
        More details ▼
      </button>
    </div>
  );
}