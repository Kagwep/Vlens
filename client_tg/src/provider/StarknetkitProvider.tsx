"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { useAccount, useConnect } from "@starknet-react/core";
import { StarknetkitConnector, useStarknetkitConnectModal } from "starknetkit";
import { useGlobalContext } from "./GlobalContext";
import { connect } from "starknetkit"

interface StarknetkitProviderProps {
  children: ReactNode;
}

const StarknetkitContext = createContext({ openModal: () => {} });

export const StarknetkitProvider = ({ children }: StarknetkitProviderProps) => {
  const { connectAsync, connectors} = useConnect();
  
  const { starknetkitConnectModal } = useStarknetkitConnectModal({
    connectors: connectors as StarknetkitConnector[],
    modalTheme: "dark",
  });

  const openModal = async () => {
    const { connector } = await starknetkitConnectModal();
    if (!connector) {
      // Handle the case where no connector is selected
      return;
    }
    await connectAsync({ connector });
  };

  const { setAccount, setAddress } = useGlobalContext(); // Access global context
  const { account, address } = useAccount(); // Get account and address from useAccount

  // Update global context whenever account or address changes
  React.useEffect(() => {
    setAccount(account);
    console.log(account)
    setAddress(address as string);
  }, [account, address, setAccount, setAddress]);


  return (
    <StarknetkitContext.Provider value={{ openModal }}>
      {children}
    </StarknetkitContext.Provider>
  );
};

export const useStarknetkit = () => {
  return useContext(StarknetkitContext);
};

// Example usage of the button within the provider
export const StarknetkitConnectButton = () => {
  const { openModal } = useStarknetkit();

  return (
    <button
      className="w-full justify-center bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition"
      onClick={openModal}
    >
      Connect Wallet
    </button>
  );
};
