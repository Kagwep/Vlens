"use client";
import { useAccount, useDisconnect } from "wagmi";
import LayerSwapInterface from "../components/LayerSwapInterface";
import { useGlobalContext } from "../provider/GlobalContext";

export default function Home() {
  const { isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { setSelectedRoute } = useGlobalContext(); 

  return (
    <main className="bg-gray-900 text-gray-100 min-h-screen">
      {/* Header */}
      <header className="fixed top-0 w-full bg-gray-900/95 border-b border-gray-800 z-10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-bold text-xl bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            Vlens
          </span>
        </div>
      </header>

      {/* Main content */}
      <div className="max-w-lg mx-auto px-4 pt-20 pb-24 space-y-6">
        {/* Wallet Connection Card */}
        <div className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden shadow-lg transition-all hover:shadow-xl hover:scale-[1.02]">
          <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-300">Connect Wallet</h3>
            <span className="text-xs px-2 py-1 bg-gray-700 rounded-full text-gray-300">
              Required
            </span>
          </div>
          <div className="p-4 text-cyan-300">
            <appkit-button />
          </div>
        </div>

        {isConnected && (
          <>
            {/* Network Selection Card */}
            <div className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden shadow-lg transition-all hover:shadow-xl hover:scale-[1.02]">
              <div className="px-4 py-3 border-b border-gray-700">
                <h3 className="text-sm font-medium text-gray-300">Select Network</h3>
              </div>
              <div className="p-4 text-cyan-300">
                <appkit-network-button />
              </div>
            </div>

            {/* LayerSwap Interface Card */}
            <div className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden shadow-lg transition-all hover:shadow-xl hover:scale-[1.02]">
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
      <nav className="fixed bottom-0 w-full bg-gray-900/95 border-t border-gray-800 md:hidden">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-center">
          <span className="text-sm font-medium text-gray-400">
            Bridge • Swap • Transfer
          </span>
        </div>
      </nav>
    </main>
  );
}