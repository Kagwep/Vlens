import React, { useEffect, useState } from 'react';
import { useGlobalContext } from '../provider/GlobalContext';
import { IMarketAsset, IMarketsResponse, IPosition, IPositionsResponse, IRewardsData, IRewardsResponse, RiskLevel } from '../type';

const VesuDataProvider = () => {
    const { account } = useGlobalContext();
    const [positions, setPositions] = useState<IPosition[]>([]);
    const [rewards, setRewards] = useState<IRewardsData | null>(null);
    const [markets, setMarkets] = useState<IMarketAsset[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
  
    const fetchMarkets = async () => {
      try {
        const marketsResponse = await fetch('https://api.vesu.xyz/markets');
        const marketsData: IMarketsResponse = await marketsResponse.json();
        setMarkets(marketsData.data);
      } catch (error) {
        console.error('Error fetching markets:', error);
        throw error;
      }
    };

    const parseRatingFromMDX = (mdxContent: string): string => {
        try {
          const ratingMatch = mdxContent.match(/export const rating\s*=\s*'(\w+)'/);
          return ratingMatch ? ratingMatch[1] : 'medium';
        } catch (error) {
          console.error('Error parsing MDX rating:', error);
          return 'medium';
        }
      };
      
      const getRiskLevel = async (position: IPosition): Promise<RiskLevel> => {
        const market = markets.find(m => 
          m.pool.id === position.pool.id && 
          m.address.toLowerCase() === position.collateral.address.toLowerCase()
        );
        
        if (!market?.risk) return 'medium';
      
        const mdxContent = await fetch(market.risk.mdxUrl).then(res => res.text());
        return parseRatingFromMDX(mdxContent) as RiskLevel;
      };

  const getMarketRisk = (marketAsset: IMarketAsset) => {
    return {
      level: marketAsset.risk.mdxUrl.includes('low') ? 'low' : 
             marketAsset.risk.mdxUrl.includes('high') ? 'high' : 'medium',
      documentation: marketAsset.risk.url,
      mdxDocumentation: marketAsset.risk.mdxUrl
    };
  };
  
    useEffect(() => {
      const fetchVesuData = async () => {
        if (!account?.address) return;
        
        setIsLoading(true);
        setError(null);
        try {
          // Fetch all data in parallel
          await Promise.all([
            // Fetch positions
            fetch(`https://api.vesu.xyz/positions?walletAddress=${account.address}`)
              .then(res => res.json())
              .then((data: IPositionsResponse) => setPositions(data.data)),
            
            // Fetch rewards
            (async () => {
              const today = new Date();
              const yesterday = new Date(today);
              yesterday.setDate(yesterday.getDate() - 1);
              const weekAgo = new Date(yesterday);
              weekAgo.setDate(weekAgo.getDate() - 7);
              const fromDate = weekAgo.toISOString().split('T')[0];
              const toDate = yesterday.toISOString().split('T')[0];
              
              const rewardsResponse = await fetch(
                `https://api.vesu.xyz/users/${account.address}/strk-rewards?fromDate=${fromDate}&toDate=${toDate}`
              );
              const rewardsData: IRewardsResponse = await rewardsResponse.json();
              setRewards(rewardsData.data);
            })(),
            
            // Fetch markets
            fetchMarkets()
          ]);
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Failed to fetch Vesu data');
          console.error('Error fetching Vesu data:', error);
        } finally {
          setIsLoading(false);
        }
      };
  
      fetchVesuData();
    }, [account?.address]);
  
    // Utility functions to work with the data
    const getEarnPositions = () => positions.filter(p => p.type === 'earn');
    const getBorrowPositions = () => positions.filter(p => p.type === 'borrow');
    
    // Calculate total value in USD across all positions
    const getTotalValueLocked = () => {
      return positions.reduce((total, position) => {
        const usdValue = position.collateral.usdPrice?.value || '0';
        const decimals = position.collateral.usdPrice?.decimals || 18;
        const value = Number(BigInt(usdValue) * BigInt(position.collateral.value) / BigInt(10 ** decimals));
        return total + value;
      }, 0);
    };
  
    // New utility functions for market data
    const getMarketsByPool = (poolId: string) => {
      return markets.filter(market => market.pool.id === poolId);
    };
  
    const getMarketByAsset = (poolId: string, assetAddress: string) => {
      return markets.find(
        market => market.pool.id === poolId && market.address.toLowerCase() === assetAddress.toLowerCase()
      );
    };
  
    const calculateAPY = (market: IMarketAsset) => {
      let apy = Number(market.stats.supplyApy.value) / Math.pow(10, market.stats.supplyApy.decimals);
      
      if (market.stats.defiSpringSupplyApr) {
        apy += Number(market.stats.defiSpringSupplyApr.value) / Math.pow(10, market.stats.defiSpringSupplyApr.decimals);
      }
      
      if (market.stats.lstApr) {
        apy += Number(market.stats.lstApr.value) / Math.pow(10, market.stats.lstApr.decimals);
      }
      
      return apy * 100; // Convert to percentage
    };
  
    const calculateMonthlyYield = (amount: string, market: IMarketAsset) => {
      const apy = calculateAPY(market) / 100; // Convert back to decimal
      const monthlyRate = apy / 12;
      const amountValue = Number(amount) / Math.pow(10, market.decimals);
      return amountValue * monthlyRate;
    };
  
    return {
      positions,
      rewards,
      markets,
      isLoading,
      error,
      getEarnPositions,
      getBorrowPositions,
      getTotalValueLocked,
      getMarketsByPool,
      getMarketByAsset,
      calculateAPY,
      calculateMonthlyYield,
      getRiskLevel,
      getMarketRisk
    };
  };
  
  export default VesuDataProvider;