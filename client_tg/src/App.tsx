"use client";


import React, { useState } from 'react';
import { useAccount } from "wagmi";
import { StarknetkitConnectButton } from "./provider/StarknetkitProvider";
import { useGlobalContext } from "./provider/GlobalContext";
import VLENS from './pages/Vlens';
import BridgeInterface from './pages/BridgeInterface'; // You'll need to create this

function App ()  {
  const { account,selectedRoute, setSelectedRoute } = useGlobalContext(); // Starknet account
  const { isConnected: isEvmConnected } = useAccount(); // EVM account
 
  // Show route selection if no route is selected and no wallet is connected
  if (!selectedRoute && !account && !isEvmConnected) {
    return (
      <div className="min-h-screen p-6 bg-gradient-to-b from-gray-900 to-gray-800 text-white">
        <div className="space-y-12">
          <div className="text-center space-y-4">
            <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
              vLens
            </h1>
            <p className="text-lg text-gray-400">
              Monitor and manage your DeFi lending positions
            </p>
          </div>

          <div className="max-w-2xl mx-auto space-y-8">
            <h2 className="text-2xl font-bold text-center">Choose Your Path</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* App Route Card */}
              <div 
                className="p-6 rounded-lg bg-gray-800 hover:bg-gray-700 cursor-pointer transition-all"
                onClick={() => setSelectedRoute('app')}
              >
                <h3 className="text-xl font-bold mb-4">Launch App</h3>
                <p className="text-gray-400 mb-4">
                  Access the full vLens dashboard to monitor and manage your DeFi positions
                </p>
                <div className="text-blue-400">Connect Starknet Wallet →</div>
              </div>

              {/* Bridge Route Card */}
              <div 
                className="p-6 rounded-lg bg-gray-800 hover:bg-gray-700 cursor-pointer transition-all"
                onClick={() => setSelectedRoute('bridge')}
              >
                <h3 className="text-xl font-bold mb-4">Bridge Tokens</h3>
                <p className="text-gray-400 mb-4">
                  Bridge your assets between chains using LayerSwap integration
                </p>
                <div className="text-blue-400">Connect EVM Wallet →</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show appropriate interface based on selection and wallet connection
  if (selectedRoute === 'app' || account) {
    return (
      <div className="min-h-screen p-6 bg-gradient-to-b from-gray-900 to-gray-800 text-white">
        {account ? (
          <VLENS />
        ) : (
          <div className="text-center space-y-6">
            <h2 className="text-2xl font-bold">Connect Your Starknet Wallet</h2>
            <StarknetkitConnectButton />
            <button 
              onClick={() => setSelectedRoute(null)}
              className="text-gray-400 hover:text-white underline"
            >
              Back to Selection
            </button>
          </div>
        )}
      </div>
    );
  }

  if (selectedRoute === 'bridge' || isEvmConnected) {
    return (
      <div className="min-h-screen p-6 bg-gradient-to-b from-gray-900 to-gray-800 text-white">
        <BridgeInterface />
      </div>
    );
  }

  // Fallback (shouldn't reach here)
  return null;
};

export default App;