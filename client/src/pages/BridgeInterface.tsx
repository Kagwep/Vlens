"use client";
import { useAccount, useDisconnect } from "wagmi";
import LayerSwapInterface from "../components/LayerSwapInterface";
import { useGlobalContext } from "../provider/GlobalContext";

export default function Home() {
  const { isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { setSelectedRoute } = useGlobalContext(); 

  return (
    <main className="min-h-screen bg-gray-900 text-gray-100">
      {/* Simple header with just the logo and home button */}
      <header className="fixed top-0 w-full bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 z-10">
        <div className="px-4 h-14 flex items-center justify-between">
          <span className="font-bold text-xl bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            Vlens
          </span>
          {isConnected ? (
            <button 
              onClick={() => disconnect()}
              className="flex items-center justify-center px-4 mx-4 py-1.5 text-sm font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 transition-colors"
            >
              Home
            </button>
          ): (
            <button 
            onClick={() => setSelectedRoute(null)}
            className="flex items-center justify-center px-4 mx-4 py-1.5 text-sm font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 transition-colors"
          >
            Home
          </button>
          )}
        </div>
      </header>

      {/* Main content with proper spacing for fixed header */}
      <div className="pt-20 px-4 pb-8 space-y-6">
        {/* Wallet Connection Card */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-300">Connect Wallet</h3>
            <span className="text-xs px-2 py-1 bg-gray-700 rounded-full text-gray-300">
              Required
            </span>
          </div>
          <div className="p-4">
            <appkit-button />
          </div>
        </div>

        {isConnected && (
          <>
            {/* Network Selection Card */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-700">
                <h3 className="text-sm font-medium text-gray-300">Select Network</h3>
              </div>
              <div className="p-4 text-slate-100">
                <appkit-network-button />
              </div>
            </div>

            {/* LayerSwap Interface Card */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-700">
                <h3 className="text-sm font-medium text-gray-300">Bridge Assets</h3>
              </div>
              <div className="p-4">
                <LayerSwapInterface />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Bottom mobile navigation bar */}
      <nav className="fixed bottom-0 w-full bg-gray-900/80 backdrop-blur-sm border-t border-gray-800 md:hidden">
        <div className="px-4 h-16 flex items-center justify-center">
          <span className="text-sm font-medium text-gray-400">
            Bridge • Swap • Transfer
          </span>
        </div>
      </nav>
    </main>
  );
}