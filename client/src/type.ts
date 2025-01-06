
import { RequestResult } from '@starknet-react/core';
import {  Call } from 'starknet'



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