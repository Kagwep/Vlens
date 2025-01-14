"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Home, Wallet, Repeat, User, Replace, ChevronDown, Loader2, Send, Copy, ExternalLink } from 'lucide-react';
import { ECONTRACTADDRESS, EXTPABI, tokensAll } from '../constants';
import { Message, QuoteResponse, SwapScreenProps, Token, TransferPanelProps } from '../type';
import { useAccount, useBalance, useSendTransaction } from '@starknet-react/core';
import { parseInputAmountToUint256 } from '../utils';
import BalancesAccordion from '../components/BalancesAccordion';
import TokenSelector from '../components/TokenSelector';
import { useGlobalContext } from '../provider/GlobalContext';
import StarknetSwap from '../components/Swap';
import { formatUnits } from 'viem';
import VesuEarnService from '../components/VesuEarnService';
import { RpcProvider } from 'starknet';
import { EarnComponent } from '../components/EarnComponent';
import SupplyComponent from '../components/SupplyComponent';

interface AppState {
  isWalletConnected: boolean;
  connectWallet: () => void;
}

const AppContext = createContext<AppState>({
  isWalletConnected: false,
  connectWallet: () => {},
});

const validTokens = tokensAll
  .filter(token => Array.isArray(token.tags) && token.tags.includes('Verified'))
  .map(token => ({
    ...token,
    logoUri: token.logoUri || '' // Convert null to empty string
  }));


const TransferPanel: React.FC<TransferPanelProps> = ({ validTokens, onTransfer }) => {
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [recipientAddress, setRecipientAddress] = useState('');

 

  const handleTransfer = async () => {
    if (!selectedToken || !amount) return;

    setIsLoading(true);
    try {
      await onTransfer(selectedToken, amount,recipientAddress);
    } catch (error) {
      console.error('Transfer failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-800 rounded-lg p-4 space-y-4">
      <h2 className="text-xl font-bold mb-4">Transfer</h2>
      
      {/* Token Selector */}
      <div className="relative">
        <button
          className="w-full p-3 bg-slate-700 rounded-lg flex items-center justify-between hover:bg-slate-600 transition-colors"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          {selectedToken ? (
            <div className="flex items-center gap-2">
              {selectedToken.logoUri && (
                <img 
                  src={selectedToken.logoUri} 
                  alt={selectedToken.symbol}
                  className="w-6 h-6 rounded-full"
                />
              )}
              <span>{selectedToken.symbol}</span>
            </div>
          ) : (
            <span className="text-slate-400">Select token</span>
          )}
          <ChevronDown className={`w-5 h-5 transition-transform ${isDropdownOpen ? 'transform rotate-180' : ''}`} />
        </button>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <div className="absolute z-10 w-full mt-2 bg-slate-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {validTokens.map((token: Token) => (
              <button
                key={token.address}
                className="w-full p-3 flex items-center gap-2 hover:bg-slate-600 transition-colors"
                onClick={() => {
                  setSelectedToken(token);
                  setIsDropdownOpen(false);
                }}
              >
                {token.logoUri && (
                  <img 
                    src={token.logoUri} 
                    alt={token.symbol}
                    className="w-6 h-6 rounded-full"
                  />
                )}
                <span>{token.symbol}</span>
              </button>
            ))}
          </div>
        )}
      </div>

            {/* Recipient Address Input */}
            <input
        type="text"
        placeholder="Recipient Address"
        value={recipientAddress}
        onChange={(e) => setRecipientAddress(e.target.value)}
        className="w-full p-3 bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {/* Amount Input */}
      <input
        type="number"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="w-full p-3 bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {/* Transfer Button */}
      <button 
        className={`w-full p-3 rounded-lg flex items-center justify-center gap-2
          ${!selectedToken || !amount || isLoading 
            ? 'bg-slate-600 cursor-not-allowed' 
            : 'bg-blue-500 hover:bg-blue-600 transition-colors'
          }`}
        onClick={handleTransfer}
        disabled={!selectedToken || !amount || isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Sending...</span>
          </>
        ) : (
          <>
            <Send className="w-5 h-5" />
            <span>Send</span>
          </>
        )}
      </button>
    </div>
  );
};

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

  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);

  const { sendAsync } = useSendTransaction({
    calls: undefined  // This is required even if undefined initially
  });


  const handleTransfer = async (token: Token, amount: string,recipientAddress: string) => {

    const calls = [
      {
        contractAddress: token.address,
        entrypoint: "transfer",
        calldata: [
          recipientAddress,
          parseInputAmountToUint256(amount).low,
          parseInputAmountToUint256(amount).high
        ]
      }
    ];

    
    const result = await sendAsync(calls);

    console.log(result)

    if (result){
      setMessage({
        text: `success: ${amount} sent to ${recipientAddress}`,
        timestamp: new Date().toISOString(),
        txHash: result.transaction_hash,
        token: token.symbol,
      })
    }else{
      setMessage({
        text:  `error ${result}`,
        timestamp: new Date().toISOString(),
        error: result,
      })
    }

    
  };

  const formatMessageText = (text: string) => {
    // Regular expression for both Starknet and Ethereum addresses
    const addressRegex = /(0x[a-fA-F0-9]{64}|0x[a-fA-F0-9]{40})/g;
    
    // Split the text into parts, with addresses and regular text separated
    const parts = text.split(addressRegex);
    
    return parts.map((part, index) => {
      if (part.match(addressRegex)) {
        const isStarknetAddress = part.length === 66; // 0x + 64 chars
        const truncated = `${part.slice(0, 6)}...${part.slice(-4)}`;
        
        return (
          <span key={index} className="font-mono bg-gray-700/50 px-1 rounded">
            {truncated}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };
  

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.error('Failed to copy:', err);
      return false;
    }
  };
  

  const handleCopyMessage = async (message: Message) => {
    // Construct text with message and time, plus transaction details if available
    const copyText = [
      message.text,
      `Time: ${message.timestamp}`,
      message.txHash && `Transaction: ${message.txHash}`,
      message.txHash && `Explorer: https://starkscan.co/tx/${message.txHash}`
    ].filter(Boolean).join('\n');

    const success = await copyToClipboard( copyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 space-y-6">
      <div className="bg-slate-800 rounded-lg p-4">
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        {/* <div className="grid grid-cols-2 gap-4">
          <ActionButton icon={<Repeat size={20} />} label="Swap" />
          <ActionButton icon={<User size={20} />} label="Lens" />
        </div> */}
      </div>

      <BalancesAccordion validTokens={validTokens as Token[]} />
      
      <TransferPanel 
        validTokens={validTokens as Token[]}
        onTransfer={handleTransfer}
      />

      {message &&(
             <div
             className={`max-w-[80%] sm:max-w-[70%] rounded-lg p-4  shadow-lg relative group`}
           >
             <div className="space-y-1.5">
               <p className="text-sm leading-relaxed whitespace-pre-line">
                 {formatMessageText(message.text)}
                 {message.text && (
                     <div className="group">
                      
                     <button
                       onClick={() => handleCopyMessage(message)} 
                       className="ml-2 inline-flex items-center text-xs opacity-100 group-hover:opacity-100 transition-opacity duration-200"
                     >
                       {copied ? (
                         <span className="text-green-400 text-xs">Copied!</span>
                       ) : (
                         <Copy size={12} className="text-gray-300 hover:text-white transition-colors" />
                       )}
                     </button>
                   </div>
                 )}
               </p>
               <div className="flex items-center space-x-2 text-xs opacity-60">
                   <span>{message.timestamp}</span>
                   {message.txHash && message.error === undefined &&  (
                   <a 
                   href={`https://starkscan.co/tx/${message.txHash}`}
                   target="_blank"
                   rel="noopener noreferrer"
                   className="flex items-center space-x-1 hover:text-blue-300 transition-colors duration-150"
                 >
                   <span>Tx: {message.txHash?.slice(0, 6)}...{message.txHash.slice(-4)}</span>
                   <ExternalLink size={12} />
                 </a>
                 )}
               </div>
             </div>
           </div>
      )}
    </div>
  );
};

const SwapScreen: React.FC = () => {
  const { address: accountAddress } = useAccount();
  const [fromToken, setFromToken] = useState<Token | null>(null);
  const [toToken, setToToken] = useState<Token | null>(null);
  const [fromAmount, setFromAmount] = useState('');
  const [quoteInfo, setQuoteInfo] = useState<QuoteResponse | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const { account, address } = useGlobalContext();


  const { sendAsync } = useSendTransaction({
    calls: undefined  // This is required even if undefined initially
  });

  
  const starknetSwap = new StarknetSwap(account!, sendAsync);

  useEffect(() => {
    const fetchQuote = async () => {
      if (!fromToken || !toToken || !fromAmount || parseFloat(fromAmount) === 0) {
        setQuoteInfo(null);
        return;
      }

      setIsLoadingQuote(true);
      try {
        const quote = await starknetSwap.getQuote(
          fromToken.address,
          toToken.address,
          fromAmount,
          fromToken.decimals
        );

        // Format the quote info for display
        setQuoteInfo({
          buyAmount: formatUnits(BigInt(quote.buyAmount), toToken.decimals),
          buyAmountInUsd: quote.buyAmountInUsd,
          sellAmountInUsd: quote.sellAmountInUsd,
          gasFeesInUsd: quote.gasFeesInUsd,
          priceRatioUsd: quote.priceRatioUsd,
          buyTokenPriceInUsd: quote.buyTokenPriceInUsd,
          sellTokenPriceInUsd: quote.sellTokenPriceInUsd
        } as any);
      } catch (error) {
        console.error('Error fetching quote:', error);
        setQuoteInfo(null);
      } finally {
        setIsLoadingQuote(false);
      }
    };

    fetchQuote();
  }, [fromToken, toToken, fromAmount]);

  const handleSwap = async () => {
    if (!fromToken || !toToken || !fromAmount || !quoteInfo) return;
    try {
      // Execute the swap with the current quote
      const txHash = await starknetSwap.executeSwap(quoteInfo.quoteId);
      console.log('Swap transaction hash:', txHash);
    } catch (error) {
      console.error('Swap failed:', error);
    }
  };

  return (
    <div className="p-4">
      <div className="bg-slate-800 rounded-lg p-4 space-y-4">
        <TokenSelector
          label="From"
          selectedToken={fromToken}
          onTokenSelect={setFromToken}
          amount={fromAmount}
          onAmountChange={setFromAmount}
          validTokens={validTokens as Token[]}
          accountAddress={accountAddress}
          mode="input"
          quoteInfo={null}
        />

        <div className="flex justify-center">
          <button
            onClick={() => {
              const temp = fromToken;
              setFromToken(toToken);
              setToToken(temp);
              setFromAmount('');
              setQuoteInfo(null);
            }}
            className="p-2 hover:bg-slate-700 rounded-full transition-colors"
          >
            <Repeat size={20} className="text-gray-400" />
          </button>
        </div>

        <TokenSelector
          label="To (estimated)"
          selectedToken={toToken}
          onTokenSelect={setToToken}
          validTokens={validTokens as Token[]}
          accountAddress={accountAddress}
          mode="output"
          quoteInfo={quoteInfo}
          isLoading={isLoadingQuote}
        />

        <button
          onClick={handleSwap}
          disabled={!fromToken || !toToken || !fromAmount || !quoteInfo}
          className={`w-full py-3 rounded-lg font-medium transition-colors ${
            !fromToken || !toToken || !fromAmount || !quoteInfo
              ? 'bg-slate-600 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          {!fromToken || !toToken 
            ? 'Select tokens'
            : !fromAmount
            ? 'Enter amount'
            : !quoteInfo
            ? 'Getting quote...'
            : 'Swap'}
        </button>
      </div>
    </div>
  );
  
};


const LensScreen = () => {
  const { account } = useGlobalContext();

  const { sendAsync } = useSendTransaction({
    calls: undefined  // This is required even if undefined initially
  });



  if (!account) {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
                <h1 className="text-xl font-medium mb-4">Connect Wallet</h1>
                <p className="text-gray-400">Please connect your wallet to continue</p>
            </div>
        </div>
    );
}

  return (
     <div className="min-h-screen bg-gray-900 py-12">
            <div className="container mx-auto px-4">
                <h1 className="text-2xl font-bold mb-8">Earn</h1>
                
                <SupplyComponent />
            </div>
        </div>
  )
};



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