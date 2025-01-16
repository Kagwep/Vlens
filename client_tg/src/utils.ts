export const shortenAddress = (addr: string | undefined): string => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  import { num, uint256 } from "starknet";

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