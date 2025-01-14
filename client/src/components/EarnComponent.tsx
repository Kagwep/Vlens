import React, { useState } from 'react';
import { useEarn } from '../hooks/useEarn';
import type { BigNumberish } from 'starknet';
import VesuEarnService from './VesuEarnService';

interface EarnComponentProps {
    earnService: VesuEarnService;
    poolId: BigNumberish;
    asset: string;
    tokenSymbol: string;
    tokenDecimals: number;
}

// Input Panel Component
const InputPanel = ({ 
    amount, 
    onAmountChange, 
    onPercentageClick,
    tokenSymbol 
}: {
    amount: string;
    onAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onPercentageClick: (percentage: number) => void;
    tokenSymbol: string;
}) => (
    <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-lg font-medium mb-4">Deposit {tokenSymbol}</h2>
        
        {/* Amount Input */}
        <div className="bg-gray-900 rounded-lg p-4 mb-4">
            <input
                type="text"
                value={amount}
                onChange={onAmountChange}
                placeholder="0.0"
                className="w-full bg-transparent text-2xl outline-none"
            />
        </div>

        {/* Percentage Buttons */}
        <div className="grid grid-cols-4 gap-2">
            {[25, 50, 75, 100].map(percentage => (
                <button
                    key={percentage}
                    onClick={() => onPercentageClick(percentage)}
                    className="bg-gray-700 hover:bg-gray-600 rounded p-2"
                >
                    {percentage}%
                </button>
            ))}
        </div>
    </div>
);

// Stats Panel Component
const StatsPanel = ({
    apy,
    position,
    earned,
    maxDeposit,
    tokenSymbol,
    onDeposit,
    isLoading
}: {
    apy: string;
    position: string;
    earned: string;
    maxDeposit: string;
    tokenSymbol: string;
    onDeposit: () => void;
    isLoading: boolean;
}) => (
    <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-lg font-medium mb-4">Position Overview</h2>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
                <div className="text-gray-400 text-sm">APY</div>
                <div className="text-xl font-medium">{apy}</div>
            </div>
            <div>
                <div className="text-gray-400 text-sm">Your Position</div>
                <div className="text-xl font-medium">{position}</div>
            </div>
        </div>

        {/* Additional Stats */}
        <div className="space-y-2 mb-6">
            <div className="flex justify-between">
                <span className="text-gray-400">Earned</span>
                <span>{earned}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-gray-400">Max Deposit</span>
                <span>{maxDeposit}</span>
            </div>
        </div>

        {/* Deposit Button */}
        <button
            onClick={onDeposit}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 
                     disabled:hover:bg-blue-600 rounded-lg p-3"
        >
            {isLoading ? 'Processing...' : 'Deposit'}
        </button>
    </div>
);

// Main Component
export const EarnComponent: React.FC<EarnComponentProps> = ({
    earnService,
    poolId,
    asset,
    tokenSymbol,
    tokenDecimals
}) => {
    const [amount, setAmount] = useState('');
    
    const {
        isLoading,
        error,
        positionInfo,
        currentRate,
        maxDeposit,
        deposit,
        formatBalance,
    } = useEarn(earnService, {
        poolId,
        asset,
        refreshInterval: 30000
    });

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (/^\d*\.?\d*$/.test(value)) {
            setAmount(value);
        }
    };

    const handlePercentageClick = (percentage: number) => {
        if (maxDeposit) {
            const max = Number(formatBalance(maxDeposit));
            setAmount(((max * percentage) / 100).toString());
        }
    };

    const handleDeposit = async () => {
        if (!amount) return;
        try {
            const depositAmount = BigInt(parseFloat(amount) * 10 ** tokenDecimals);
            await deposit(depositAmount);
            setAmount('');
        } catch (error) {
            console.error('Deposit failed:', error);
        }
    };

    if (error) {
        return (
            <div className="p-4 bg-red-500/10 text-red-500 rounded-lg">
                {error}
            </div>
        );
    }

    const formattedAPY = currentRate ? 
        `${(Number(currentRate) / 1e16).toFixed(2)}%` : 
        '0.00%';

    const formattedPosition = positionInfo ? 
        `${formatBalance(positionInfo.depositedAmount)} ${tokenSymbol}` :
        `0.00 ${tokenSymbol}`;

    const formattedEarned = positionInfo ? 
        `${formatBalance(positionInfo.earnedAmount)} ${tokenSymbol}` :
        `0.00 ${tokenSymbol}`;

    const formattedMaxDeposit = maxDeposit ? 
        `${formatBalance(maxDeposit)} ${tokenSymbol}` :
        `0.00 ${tokenSymbol}`;

    return (
        <div className="max-w-6xl mx-auto p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputPanel
                    amount={amount}
                    onAmountChange={handleAmountChange}
                    onPercentageClick={handlePercentageClick}
                    tokenSymbol={tokenSymbol}
                />
                <StatsPanel
                    apy={formattedAPY}
                    position={formattedPosition}
                    earned={formattedEarned}
                    maxDeposit={formattedMaxDeposit}
                    tokenSymbol={tokenSymbol}
                    onDeposit={handleDeposit}
                    isLoading={isLoading}
                />
            </div>
        </div>
    );
};