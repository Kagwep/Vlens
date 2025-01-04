"use client";

import React, { createContext, useContext, useState } from 'react';
import { Home, Wallet, Repeat, User, Replace } from 'lucide-react';
import { useAccount } from 'wagmi';

interface AppState {
  isWalletConnected: boolean;
  connectWallet: () => void;
}

const AppContext = createContext<AppState>({
  isWalletConnected: false,
  connectWallet: () => {},
});

const VLENS = () => {
  const [activeTab, setActiveTab] = useState<'home' | 'swap' | 'lens' | 'bridge'>('home');
  const [isWalletConnected, setIsWalletConnected] = useState(false);

  const appState: AppState = {
    isWalletConnected,
    connectWallet: () => setIsWalletConnected(true),
  };

  return (
    <AppContext.Provider value={appState}>
      <div className="min-h-screen bg-slate-900 text-white relative">
        <div className="pb-16">
          {activeTab === 'home' && <HomeScreen />}
          {activeTab === 'swap' && <SwapScreen />}
          {activeTab === 'lens' && <LensScreen />}
        </div>

        <nav className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700">
          <div className="flex justify-around items-center h-16">
            <NavButton
              icon={<Home size={24} />}
              label="Home"
              isActive={activeTab === 'home'}
              onClick={() => setActiveTab('home')}
            />
            <NavButton
              icon={<Repeat size={24} />}
              label="Swap"
              isActive={activeTab === 'swap'}
              onClick={() => setActiveTab('swap')}
            />
            <NavButton
              icon={<User size={24} />}
              label="Lens"
              isActive={activeTab === 'lens'}
              onClick={() => setActiveTab('lens')}
            />
          </div>
        </nav>
      </div>
    </AppContext.Provider>
  );
};

const HomeScreen = () => {
    const { isConnected } = useAccount();
  
  return (
    <div className="p-4 space-y-6">
      <div className="bg-slate-800 rounded-lg p-4">
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-4">
          <ActionButton icon={<Repeat size={20} />} label="Swap" />
          <ActionButton icon={<User size={20} />} label="Lens" />
        </div>
      </div>
    </div>
  );
};

const SwapScreen = () => (
  <div className="p-4">
    <div className="bg-slate-800 rounded-lg p-4 space-y-4">
      <div className="space-y-2">
        <label className="text-sm text-gray-400">From</label>
        <input
          type="text"
          placeholder="0.0"
          className="w-full bg-slate-700 rounded-lg p-3 outline-none"
        />
      </div>
      <div className="flex justify-center">
        <Repeat size={20} className="text-gray-400" />
      </div>
      <div className="space-y-2">
        <label className="text-sm text-gray-400">To</label>
        <input
          type="text"
          placeholder="0.0"
          className="w-full bg-slate-700 rounded-lg p-3 outline-none"
        />
      </div>
      <button className="w-full bg-blue-500 hover:bg-blue-600 py-3 rounded-lg font-medium transition-colors">
        Swap
      </button>
    </div>
  </div>
);

const LensScreen = () => (
  <div className="p-4">
    <div className="bg-slate-800 rounded-lg p-4">
      <h2 className="text-xl font-bold mb-4">Lens Profile</h2>
    </div>
  </div>
);



interface NavButtonProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const NavButton: React.FC<NavButtonProps> = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center space-y-1 p-2 ${
      isActive ? 'text-blue-500' : 'text-gray-400'
    }`}
  >
    {icon}
    <span className="text-xs">{label}</span>
  </button>
);

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
}

const ActionButton: React.FC<ActionButtonProps> = ({ icon, label }) => (
  <button className="flex items-center justify-center space-x-2 bg-slate-700 hover:bg-slate-600 p-3 rounded-lg transition-colors">
    {icon}
    <span className="text-sm">{label}</span>
  </button>
);

export default VLENS;