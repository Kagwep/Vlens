import { useContract, useSendTransaction } from '@starknet-react/core';
import React, { useEffect, useRef, useState } from 'react';
import { LEND_CONTRACT_ADRRESS, LENDABI, SINGE, VETH } from '../constants';
import { Abi } from 'starknet';
import { formatTokenAmount, getUnderlyingToken, parseInputAmountToUint256 } from '../utils';
import tokens from "../abi/markets.json";
import { IMarketAsset, IPosition, RiskLevel, Token, TokenMapping } from '../type';
import { useGlobalContext } from '../provider/GlobalContext';
import VesuDataProvider from './VesuDataProvider';
import { Info } from 'lucide-react';
import { Index } from 'viem';
import PositionsRenderer from './PositionsRenderer';
import { ChevronDown } from 'lucide-react';

interface PositionRenderProps {
  positions: IPosition[];
  markets: IMarketAsset[];
  getMarketByAsset: (poolId: string, assetAddress: string) => IMarketAsset | undefined;
  calculateAPY: (market: IMarketAsset) => number;
  calculateMonthlyYield: (amount: string, market: IMarketAsset) => number;
  getRiskLevel: (position: IPosition) => Promise<RiskLevel>;
}

const LendingInterface = () => {
  const [activeTab, setActiveTab] = useState('earn');

  const {account} = useGlobalContext();
  
  const { contract } = useContract({
    address: LEND_CONTRACT_ADRRESS,
    abi: LENDABI as Abi
  });
  
  const pools = {
    Genesis: "2198503327643286920898110335698706244522220458610657370981979460625005526824",
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
    collateralToken: Token | null;
    borrowToken: Token | null;
    borrowAmount: string;
    collateralAmount: string;
  }>({
    collateralToken: null,
    borrowToken: null,
    borrowAmount: '',
    collateralAmount: '',
  });

  const { sendAsync } = useSendTransaction({
    calls: undefined
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [positionRisks, setPositionRisks] = useState<Record<string, RiskLevel>>({});

    const {
      positions,
      rewards,
      markets,
      getEarnPositions,
      getBorrowPositions,
      getTotalValueLocked,
      getMarketsByPool,
      getMarketByAsset,
      calculateAPY,
      calculateMonthlyYield,
      getRiskLevel,
      getMarketRisk,
      isLoading: dataLoading,
      error: errorInLoading
    } = VesuDataProvider();

  const [tokenMappings, setTokenMappings] = useState<TokenMapping[]>([]);

    useEffect(() => {
      const mappings = markets.map(market => ({
        vTokenAddress: market.vToken.address,
        underlyingAddress: market.address,
        symbol: market.symbol,
        pool: market.pool.name,
        name: market.name
      }));
      setTokenMappings(mappings);
    }, [markets]);

  const handleSupply = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    if(!supplyForm.token) return;

    const underlying = getUnderlyingToken(supplyForm.token.address, tokenMappings);

    if(!underlying) return;

    try {
      const calls = [
        {
          contractAddress: underlying.underlyingAddress,
          entrypoint: "approve",
          calldata: [
            supplyForm.token.address,
            parseInputAmountToUint256(supplyForm.amount).low,
            parseInputAmountToUint256(supplyForm.amount).high
          ]
        },
        {
          contractAddress: supplyForm.token.address,
          entrypoint: "deposit",
          calldata: [
            parseInputAmountToUint256(supplyForm.amount).low,
            parseInputAmountToUint256(supplyForm.amount).high,
            SINGE
          ]
        }
      ];
      await sendAsync(calls);
      setSuccess('Transaction successful!');
      getEarnPositions()
    } catch (err) {
      setError((err as Error).message || 'Supply transaction failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to get pool ID from pool name
const getPoolId = (poolName: string): string => {
  return pools[poolName as keyof typeof pools] || '';
};


  const handleBorrow = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');
    try {

      const { collateralToken, borrowToken, borrowAmount } = borrowForm;
    
      if (!collateralToken || !borrowToken || !borrowAmount) {
        throw new Error('Please fill in all fields');
      }

      console.log(collateralToken.pool)

            // Get pool ID from collateral token's pool
      const poolId = getPoolId(collateralToken.pool);
      if (!poolId) {
        throw new Error('Invalid pool selection');
      }

            // Get underlying token address for both collateral and borrow tokens
      const underlyingCollateral = getUnderlyingToken(collateralToken.address, tokenMappings);
      const underlyingBorrow = getUnderlyingToken(borrowToken.address, tokenMappings);

      if (! underlyingBorrow || !underlyingCollateral) return;

      const calls = [
        {
          contractAddress: underlyingCollateral.underlyingAddress,
          entrypoint: "approve",
          calldata: [
            LEND_CONTRACT_ADRRESS,
            parseInputAmountToUint256(borrowForm.collateralAmount).low,
            parseInputAmountToUint256(borrowForm.collateralAmount).high,
          ]
        },
        {
          contractAddress: LEND_CONTRACT_ADRRESS,
          entrypoint: "supply_and_borrow",
          calldata: [
            poolId,
            underlyingCollateral.underlyingAddress,
            underlyingBorrow.underlyingAddress,
            parseInputAmountToUint256(borrowForm.collateralAmount).low,
            parseInputAmountToUint256(borrowForm.collateralAmount).high,
            parseInputAmountToUint256(borrowForm.borrowAmount).low,
            parseInputAmountToUint256(borrowForm.borrowAmount).high
          ]
        }
      ];
      await sendAsync(calls);
      setSuccess('Transaction successful!');
      getBorrowPositions()
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
  }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
  
    // Group tokens by pool
    const groupedTokens = tokens.tokens.reduce((acc, token) => {
      if (!acc[token.pool]) {
        acc[token.pool] = [];
      }
      acc[token.pool].push(token as unknown as Token);
      return acc;
    }, {} as Record<string, Token[]>);
  
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };
  
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
  
    return (
      <div className="space-y-2" ref={dropdownRef}>
        <label className="block text-sm font-medium text-gray-300">
          {label}
        </label>
        
        <div className="relative">
          <button
            type="button"
            className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 text-left flex items-center justify-between"
            onClick={() => setIsOpen(!isOpen)}
          >
            {value ? (
              <div className="flex items-center space-x-2">
                <img 
                  src={value.iconUrl} 
                  alt={`${value.symbol} icon`} 
                  className="w-6 h-6"
                />
                <div className="flex flex-col">
                  <span className="text-gray-200">{value.symbol} - {value.name}</span>
                  <span className="text-xs text-gray-400">{value.pool}</span>
                </div>
              </div>
            ) : (
              <span className="text-gray-400">Select a token</span>
            )}
            <ChevronDown className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
  
          {isOpen && (
            <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {Object.entries(groupedTokens).map(([pool, poolTokens]) => (
                <div key={pool}>
                  <div className="px-3 py-2 text-xs font-semibold text-gray-400 bg-gray-900">
                    {pool}
                  </div>
                  {poolTokens.map((token) => (
                    <div
                      key={`${token.id}-${token.pool}`}
                      className="flex items-center p-3 hover:bg-gray-700 cursor-pointer transition-colors"
                      onClick={() => {
                        onChange(token);
                        setIsOpen(false);
                      }}
                    >
                      <img 
                        src={token.iconUrl} 
                        alt={`${token.symbol} icon`} 
                        className="w-6 h-6 mr-2"
                      />
                      <span className="text-gray-200">{token.symbol} - {token.name}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
  
        {/* {value && (
          <div className="flex items-center p-2 bg-gray-800 rounded-md border border-gray-700">
            <img 
              src={value.iconUrl} 
              alt={`${value.symbol} icon`} 
              className="w-6 h-6 mr-2"
            />
            <div className="flex flex-col">
              <span className="text-sm text-gray-300">{value.symbol} - {value.name}</span>
              <span className="text-xs text-gray-400">{value.pool}</span>
            </div>
          </div>
        )} */}
      </div>
    );
  };
  

    // Filter positions by type
    const earnPositions = positions.filter(p => p.type === 'earn');
    const borrowPositions = positions.filter(p => p.type === 'borrow');

    const getUSDPrice = (priceValue: string, decimals: number): number => {
      return Number(BigInt(priceValue)) / 10 ** decimals;
    };
    

    useEffect(() => {
      const loadRiskLevels = async () => {
        const risks: Record<string, RiskLevel> = {};
        
        for (const position of positions) {
          risks[position.collateral.address] = await getRiskLevel(position);
        }
        
        setPositionRisks(risks);
      };
  
      loadRiskLevels();
    }, [positions]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 ">
      <div className=" mx-auto">

        {/* Rewards Section */}
          {rewards && (
          <div className="mb-6 p-4 bg-gray-800 rounded-xl shadow-xl border border-gray-700">
            <h2 className="text-lg font-medium text-gray-200 mb-2">STRK Rewards</h2>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Available Rewards</span>
              <span className="text-gray-200">
                {formatTokenAmount(rewards.amount, rewards.decimals)} STRK
              </span>
            </div>
          </div>
        )}

        <div className="bg-gray-800 rounded-xl shadow-xl overflow-hidden border border-gray-700">
          <div className="p-8">
            <h1 className="text-3xl font-bold text-center mb-8 text-gray-100"></h1>
            
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
                    I will deposit
                  </label>
                  <input
                    type="text"
                    className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 text-gray-200 placeholder-gray-500"
                    placeholder="Enter amount"
                    value={borrowForm.collateralAmount}
                    onChange={(e) => setBorrowForm(prev => ({ ...prev, collateralAmount: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    To Borrow 
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
          <PositionsRenderer
            positions={activeTab === 'earn' ? getEarnPositions() : getBorrowPositions()}
            markets={markets}
            getMarketByAsset={getMarketByAsset}
            calculateAPY={calculateAPY}
            calculateMonthlyYield={calculateMonthlyYield}
            getRiskLevel={getRiskLevel}
          />
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