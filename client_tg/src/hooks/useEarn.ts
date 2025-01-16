// hooks/useEarn.ts
import { useReducer, useCallback, useEffect, useRef } from 'react';
import VesuEarnService from '../components/VesuEarnService';
import { earnReducer, initialEarnState } from '../earnReducer';
import type { UseEarnConfig } from '../type';
import type { BigNumberish } from 'starknet';

export function useEarn(
    earnService: VesuEarnService,
    config: UseEarnConfig
) {
    const [state, dispatch] = useReducer(earnReducer, initialEarnState);
    const { poolId, asset, refreshInterval = 30000 } = config;

    // Keep track of mounted state to prevent updates after unmount
    const mounted = useRef(true);
    useEffect(() => {
        mounted.current = true;
        return () => { mounted.current = false };
    }, []);

    // Load position info
    const loadPosition = useCallback(async () => {
        if (!mounted.current) return;
        
        dispatch({ type: 'LOADING_START' });
        try {
            const [positionInfo, currentRate, maxDeposit] = await Promise.all([
                earnService.getPositionInfo(poolId, asset),
                earnService.getCurrentRate(poolId, asset),
                earnService.getMaxDeposit(poolId, asset)
            ]);

            if (mounted.current) {
                dispatch({ type: 'SET_POSITION', payload: positionInfo });
                dispatch({ type: 'SET_RATE', payload: currentRate });
                dispatch({ type: 'SET_MAX_DEPOSIT', payload: maxDeposit });
            }
        } catch (error) {
            if (mounted.current) {
                dispatch({ 
                    type: 'SET_ERROR', 
                    payload: error instanceof Error ? error.message : 'Failed to load position' 
                });
            }
        } finally {
            if (mounted.current) {
                dispatch({ type: 'LOADING_END' });
            }
        }
    }, [earnService, poolId, asset]);

    // Handle deposits
    const deposit = useCallback(async (amount: BigNumberish): Promise<string> => {
        dispatch({ type: 'LOADING_START' });
        try {
            const hash = await earnService.deposit({
                poolId,
                asset,
                amount
            });

            dispatch({ type: 'SET_TRANSACTION_HASH', payload: hash });

            // Wait for transaction confirmation and reload position
            await earnService.provider.waitForTransaction(hash);
            await loadPosition();

            return hash;
        } catch (error) {
            dispatch({ 
                type: 'SET_ERROR', 
                payload: error instanceof Error ? error.message : 'Deposit failed' 
            });
            throw error;
        } finally {
            dispatch({ type: 'LOADING_END' });
        }
    }, [earnService, poolId, asset, loadPosition]);

    // Auto-refresh position
    useEffect(() => {
        loadPosition();
        
        if (refreshInterval > 0) {
            const interval = setInterval(loadPosition, refreshInterval);
            return () => clearInterval(interval);
        }
    }, [loadPosition, refreshInterval]);

    // Reset state
    const reset = useCallback(() => {
        dispatch({ type: 'RESET_STATE' });
    }, []);

    // Format balance for display
    const formatBalance = useCallback((amount: BigNumberish): string => {
        try {
            const value = BigInt(amount);
            return (Number(value) / 1e18).toFixed(6);
        } catch {
            return '0.000000';
        }
    }, []);

    return {
        // State
        isLoading: state.isLoading,
        error: state.error,
        positionInfo: state.positionInfo,
        currentRate: state.currentRate,
        maxDeposit: state.maxDeposit,
        transactionHash: state.transactionHash,

        // Actions
        deposit,
        loadPosition,
        reset,
        formatBalance
    };
}