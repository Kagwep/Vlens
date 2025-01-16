import { useBalance } from "@starknet-react/core";

export const useTokenBalance = (tokenAddress: string, accountAddress: string | undefined ) => {

    

    const { data, error } = useBalance({
      address: accountAddress as `0x${string}`,
      token: tokenAddress as `0x${string}`,
      watch: true,
    });
  
    return {
      balance: data?.formatted,
      symbol: data?.symbol,
      error,
      isLoading: !error && !data,
    };
  };
  
  