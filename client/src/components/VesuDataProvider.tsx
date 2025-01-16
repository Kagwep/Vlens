import React, { useEffect, useState } from 'react';
import { useGlobalContext } from '../provider/GlobalContext';
import { IPosition, IPositionsResponse, IRewardsData, IRewardsResponse } from '../type';

const VesuDataProvider = () => {
    const { account } = useGlobalContext();
    const [positions, setPositions] = useState<IPosition[]>([]);
    const [rewards, setRewards] = useState<IRewardsData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchVesuData = async () => {
            if (!account?.address) return;
            
            setIsLoading(true);
            setError(null);

            try {
                // Fetch positions
                const positionsResponse = await fetch(
                    `https://api.vesu.xyz/positions?walletAddress=${account.address}`
                );
                const positionsData: IPositionsResponse = await positionsResponse.json();
                setPositions(positionsData.data);

                // Fetch rewards
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

    return {
        positions,
        rewards,
        isLoading,
        error,
        getEarnPositions,
        getBorrowPositions,
        getTotalValueLocked
    };
};

export default VesuDataProvider;