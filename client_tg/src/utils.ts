export const shortenAddress = (addr: string | undefined): string => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  import { num, uint256 } from "starknet";
import { TokenMapping } from "./type";

export interface BigDecimal {
  value: bigint;
  decimals: number;
}

export type Token = {
  name: string;
  address: string;
  symbol: string;
  decimals: number;
  logoUri: string;
  lastDailyVolumeUsd: number;
  extensions: Record<string, any>;
  tags: string[];
};

export const parseUnits = (value: string, decimals: number): BigDecimal => {
  let [integer, fraction = ""] = value.split(".");

  const negative = integer.startsWith("-");
  if (negative) {
    integer = integer.slice(1);
  }

  // If the fraction is longer than allowed, round it off
  if (fraction.length > decimals) {
    const unitIndex = decimals;
    const unit = Number(fraction[unitIndex]);

    if (unit >= 5) {
      const fractionBigInt = BigInt(fraction.slice(0, decimals)) + BigInt(1);
      fraction = fractionBigInt.toString().padStart(decimals, "0");
    } else {
      fraction = fraction.slice(0, decimals);
    }
  } else {
    fraction = fraction.padEnd(decimals, "0");
  }

  const parsedValue = BigInt(`${negative ? "-" : ""}${integer}${fraction}`);

  return {
    value: parsedValue,
    decimals,
  };
};

export const getUint256CalldataFromBN = (bn: num.BigNumberish) => uint256.bnToUint256(bn);

export const parseInputAmountToUint256 = (input: string, decimals: number = 18) =>
  getUint256CalldataFromBN(parseUnits(input, decimals).value);


const normalizeSymbol = (symbol: string): string => {
  return symbol.trim().toUpperCase();
};

// Helper function to find token by symbol
export const findTokenBySymbol = (symbol: string, tokens: Token[]): Token | undefined => {
  const normalizedSymbol = normalizeSymbol(symbol);
  return tokens.find(token => normalizeSymbol(token.symbol) === normalizedSymbol);
};

// Utility function for formatting numbers with decimals
export const formatTokenAmount = (value: string, decimals: number) => {
  if (!value) return '0';
  const valueBn = BigInt(value);
  const divisor = BigInt(10 ** decimals);
  const integerPart = valueBn / divisor;
  const fractionalPart = valueBn % divisor;
  
  // Convert fractional part to string and pad with leading zeros
  let fractionalStr = fractionalPart.toString().padStart(decimals, '0');
  // Remove trailing zeros
  fractionalStr = fractionalStr.replace(/0+$/, '');
  
  return fractionalStr ? `${integerPart}.${fractionalStr}` : integerPart.toString();
};


// Create mapping from market data
const createTokenMappings = (marketData: any): TokenMapping[] => {
  return marketData.data.map((market: any) => ({
    vTokenAddress: market.vToken.address,
    underlyingAddress: market.address,
    symbol: market.symbol,
    pool: market.pool.name,
    name: market.name
  }));
};

    // Function to get the underlying token from a vToken address
    export const getUnderlyingToken = (vTokenAddress: string, mappings: TokenMapping[]): TokenMapping | undefined => {
      return mappings.find(mapping => 
        mapping.vTokenAddress.toLowerCase() === vTokenAddress.toLowerCase()
      );
    };
// Utility function to find vToken from underlying address
const getVToken = (underlyingAddress: string, pool: string, mappings: TokenMapping[]): TokenMapping | undefined => {
  return mappings.find(mapping => 
    mapping.underlyingAddress.toLowerCase() === underlyingAddress.toLowerCase() && 
    mapping.pool === pool
  );
};
