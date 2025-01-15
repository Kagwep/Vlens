
import { RequestResult } from '@starknet-react/core';
import {  Call } from 'starknet'
import type { BigNumberish } from 'starknet';


export type SendAsyncFunction = (args?: Call[]) => Promise<RequestResult<"wallet_addInvokeTransaction">>;

export interface Token {
    name: string;
    address: string;
    symbol: string;
    decimals: number;
    logoUri: string;
    lastDailyVolumeUsd: number;
    extensions: {
      coingeckoId: string;
    };
    tags: string[];
  }
  
  export interface ActionButtonProps {
    icon: React.ReactNode;
    label: string;
  }
  
  export interface TransferPanelProps {
    validTokens: Token[];
    onTransfer: (token: Token, amount: string, recipientAddress: string) => Promise<void>;
    
  }

  export interface Message {

    text: string;
    timestamp: string;
    txHash?: string;
    token?: string;
    error?: string;
  
  }

  export interface TokenSelectorProps {
    label: string;
    selectedToken: Token | null;
    onTokenSelect: (token: Token) => void;
    amount?: string;
    onAmountChange?: (value: string) => void;
    validTokens: Token[];
    accountAddress?: string;
    mode: 'input' | 'output';
    quoteInfo: QuoteResponse | null;
    isLoading?: boolean;
  }

  export interface SwapScreenProps {
    validTokens: Token[];
  }
  

  export interface TokenItemProps {
    token: Token;
    accountAddress?: string;
    onClick: (token: Token) => void;
  }

  export interface Route {
    name: string;
    address: string;
    percent: number;
    sellTokenAddress: string;
    buyTokenAddress: string;
    routeInfo: {
      token0: string;
      token1: string;
      fee: string;
      tickSpacing: string;
      extension: string;
    };
    routes: any[]; // Can be more specific if needed
  }
  
  export interface GasTokenPrice {
    tokenAddress: string;
    gasFeesInGasToken: string;
    gasFeesInUsd: number;
  }
  
  export interface GaslessInfo {
    active: boolean;
    gasTokenPrices: GasTokenPrice[];
  }
  
  export interface QuoteResponse {
    // Quote identification
    quoteId: string;
    chainId: string;
    blockNumber: string;
    expiry: string | null;
  
    // Token amounts
    sellTokenAddress: string;
    sellAmount: string;
    sellAmountInUsd: number;
    buyTokenAddress: string;
    buyAmount: string;
    buyAmountInUsd: number;
    buyAmountWithoutFees: string;
    buyAmountWithoutFeesInUsd: number;
  
    // Pricing info
    priceRatioUsd: number;
    sellTokenPriceInUsd: number;
    buyTokenPriceInUsd: number;
  
    // Fees
    gasFees: string;
    gasFeesInUsd: number;
    avnuFees: string;
    avnuFeesInUsd: number;
    avnuFeesBps: string;
    integratorFees: string;
    integratorFeesInUsd: number;
    integratorFeesBps: string;
  
    // Route information
    routes: Route[];
    liquiditySource: string;
    estimatedAmount: boolean;
    exactTokenTo: boolean;
  
    // Gasless swap information
    gasless: GaslessInfo;
  }

  export interface Amount {
    amount_type: number; // 0 for Delta
    denomination: number; // 0 for Assets
    value: any; // uint256
  }
  
  export interface Position {
    collateral_shares: string;
    nominal_debt: string;
  }
  
  // Constants
export const SCALE = BigInt('1000000000000000000'); // 1e18

// Core Position type for tracking deposits
export interface EPosition {
    collateral_shares: BigNumberish;  // [SCALE]
    nominal_debt: BigNumberish;       // [SCALE]
}

// Configuration for the earning pool
export interface AssetConfig {
    total_collateral_shares: BigNumberish;    // [SCALE]
    total_nominal_debt: BigNumberish;         // [SCALE]
    reserve: BigNumberish;                    // [asset scale]
    max_utilization: BigNumberish;            // [SCALE]
    floor: BigNumberish;                      // [SCALE]
    scale: BigNumberish;                      // [SCALE]
    is_legacy: boolean;
    last_updated: number;                     // [seconds]
    last_rate_accumulator: BigNumberish;      // [SCALE]
    last_full_utilization_rate: BigNumberish; // [SCALE]
    fee_rate: BigNumberish;                   // [SCALE]
}

// For handling deposit amounts
export interface EAmount {
    amount_type: 'Delta' | 'Target';
    denomination: 'Native' | 'Assets';
    value: BigNumberish;
}

// Parameters needed for deposits
export interface DepositParams {
    pool_id: BigNumberish;
    asset: string;  // ContractAddress
    amount: Amount;
}

// Current earning position info
export interface EarnPositionInfo {
    depositedAmount: BigNumberish;    // [asset scale]
    earnedAmount: BigNumberish;       // [asset scale]
    totalShares: BigNumberish;        // [SCALE]
    apy: BigNumberish;               // [SCALE]
}


export interface EarnState {
  isLoading: boolean;
  error: string | null;
  transactionHash: string | null;
  positionInfo: {
      depositedAmount: BigNumberish;
      earnedAmount: BigNumberish;
      totalShares: BigNumberish;
      apy: BigNumberish;
  } | null;
  currentRate: BigNumberish | null;
  maxDeposit: BigNumberish | null;
}

export interface EarnTransactionState {
  isProcessing: boolean;
  error: string | null;
  hash: string | null;
}

export interface UseEarnConfig {
  poolId: BigNumberish;
  asset: string;
  refreshInterval?: number; // in milliseconds
}

export type EarnActionType = 
  | { type: 'LOADING_START' }
  | { type: 'LOADING_END' }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_POSITION'; payload: EarnState['positionInfo'] }
  | { type: 'SET_RATE'; payload: BigNumberish }
  | { type: 'SET_MAX_DEPOSIT'; payload: BigNumberish }
  | { type: 'SET_TRANSACTION_HASH'; payload: string }
  | { type: 'RESET_STATE' };

  export interface Token {
    id: string;
    name: string;
    symbol: string;
    address: string;
    iconUrl: string;
    pool: string;
    decimals: number;
    chainId: number;
  }