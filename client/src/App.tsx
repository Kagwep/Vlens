import React from 'react';
import { useGlobalContext } from "./provider/GlobalContext";
import { StarknetkitConnectButton } from "./provider/StarknetkitProvider";
import VLENS from './pages/Vlens';

function App() {
  const { account, setSelectedRoute } = useGlobalContext();

  return (
    <div className="min-h-screen p-6 bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      {account ? (
        <VLENS />
      ) : (
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
              vLens
            </h1>
            <p className="text-xl text-gray-300">
              Monitor and manage your DeFi lending positions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700">
              <div className="h-12 w-12 mb-4 mx-auto bg-blue-500/10 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Earn & Borrow with Vesu</h3>
              <p className="text-gray-400 mb-4">
                Supply assets to earn yield and borrow against your collateral with competitive rates on Vesu.xyz
              </p>
            </div>

            <div className="p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700">
              <div className="h-12 w-12 mb-4 mx-auto bg-purple-500/10 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Seamless Bridge Integration</h3>
              <p className="text-gray-400 mb-4">
                Bridge tokens from any chain to Starknet with just a few clicks using our integrated bridge solution
              </p>
            </div>
          </div>

          <div className="max-w-md mx-auto p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700">
            <h2 className="text-2xl font-bold mb-6">Connect Your Starknet Wallet</h2>
            <StarknetkitConnectButton />
            <div className="mt-4 text-sm text-gray-400">
              Connect your wallet to access lending, borrowing, and bridging features
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

export default App;