import { useContract, useAccount, useSendTransaction } from '@starknet-react/core';
import { useCallback, useState } from 'react';
import { uint256, stark, Abi } from 'starknet';
import { ASSETS, CONTRACTS, EXTENSION_ABI, ORACLE_ABI, POOL_ID, SINGLETON_ABI } from '../constants';
import { Position } from '../type';
import { useGlobalContext } from '../provider/GlobalContext';



export function useVesuP2P() {
    const { account, address } = useGlobalContext();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
  

    const { sendAsync } = useSendTransaction({
      calls: undefined  // This is required even if undefined initially
    });
  
    // Connect to contracts
    const { contract: singleton } = useContract({
      address: CONTRACTS.singleton as `0x${string}`,
      abi: SINGLETON_ABI as Abi
    });
  
    const { contract: extension } = useContract({
      address: CONTRACTS.extension as `0x${string}`,
      abi: EXTENSION_ABI as Abi
    });
  
    const { contract: oracle } = useContract({
      address: CONTRACTS.pragma_oracle as `0x${string}`,
      abi: ORACLE_ABI as Abi
    });
  
    // Get asset price from oracle
    const getAssetPrice = useCallback(async (asset: string) => {
      if (!oracle || !extension) return null;
  
      try {
        const price = await extension.price(POOL_ID, asset);
        return price;
      } catch (error) {
        console.error("Error getting asset price:", error);
        return null;
      }
    }, [oracle, extension]);
  
    // Create lending offer
    const createLendingOffer = useCallback(async (
      amount: number,
      minCollateral: number,
      interestRate: number,
      lendAsset: string,
      collateralAsset: string
    ) => {
      if (!account || !singleton) {
        setError("Wallet not connected");
        return;
      }
  
      setLoading(true);
      setError(null);
  
      try {
        const amountUint256 = uint256.bnToUint256(amount);
        

        // const calldata = [form.values.title, form.values.channels, form.values.price];
        // const mycall = contract.populate("add_package", calldata);
 
        // // Create position through singleton
        // const call = await singleton.modify_position({
        //   pool_id: POOL_ID,
        //   collateral_asset: "0x0", // No collateral for lender
        //   debt_asset: lendAsset,
        //   user: address,
        //   collateral: {
        //     amount_type: 0,
        //     denomination: 0,
        //     value: amountUint256
        //   },
        //   debt: {
        //     amount_type: 0,
        //     denomination: 0,
        //     value: 0
        //   },
        //   data: [amount, minCollateral, interestRate]
        // });
  
        // const tx = await account.execute(call);
        return ;
      } catch (error) {
        console.error("Error creating lending offer:", error);
        setError("Failed to create lending offer");
        throw error;
      } finally {
        setLoading(false);
      }
    }, [account, singleton, address]);
  
    // Accept lending offer
    const acceptLendingOffer = useCallback(async (
      offerId: string,
      collateralAmount: number,
      lendAsset: string,
      collateralAsset: string,
      loanAmount: number
    ) => {
      if (!account || !singleton) {
        setError("Wallet not connected");
        return;
      }
  
      setLoading(true);
      setError(null);
  
      try {
        const collateralUint256 = uint256.bnToUint256(collateralAmount);
        const loanUint256 = uint256.bnToUint256(loanAmount);
  
        // First approve collateral
        const approveCall = {
          contractAddress: collateralAsset,
          entrypoint: "approve",
          calldata: [CONTRACTS.singleton, collateralUint256]
        };
  
        // Then accept offer
        const acceptCall = await singleton.modify_position({
          pool_id: POOL_ID,
          collateral_asset: collateralAsset,
          debt_asset: lendAsset,
          user: address,
          collateral: {
            amount_type: 0,
            denomination: 0,
            value: collateralUint256
          },
          debt: {
            amount_type: 0,
            denomination: 0,
            value: loanUint256
          },
          data: [offerId]
        });
  
        const tx = await account.execute([approveCall, acceptCall]);
        return tx;
      } catch (error) {
        console.error("Error accepting offer:", error);
        setError("Failed to accept offer");
        throw error;
      } finally {
        setLoading(false);
      }
    }, [account, singleton, address]);
  
    // Get user's active positions
    const getPositions = useCallback(async (
      userAddress: string,
      collateralAsset: string = ASSETS.ETH,
      debtAsset: string = ASSETS.USDC
    ): Promise<Position | null> => {
      if (!singleton) return null;
  
      try {
        const position = await singleton.position_unsafe(
          POOL_ID,
          collateralAsset,
          debtAsset,
          userAddress
        );
  
        return position;
      } catch (error) {
        console.error("Error fetching positions:", error);
        return null;
      }
    }, [singleton]);
  
    return {
      createLendingOffer,
      acceptLendingOffer,
      getPositions,
      getAssetPrice,
      loading,
      error,
      ASSETS
    };
  }
  