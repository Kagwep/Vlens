import { ChevronDown } from "lucide-react";
import { useTokenBalance } from "../hooks/useTokenBalance";
import { Token, TokenSelectorProps } from "../type";
import { useState } from "react";
import TokenItem from "./TokenItem";

const TokenSelector: React.FC<TokenSelectorProps> = ({
    label,
    selectedToken,
    onTokenSelect,
    amount,
    onAmountChange,
    validTokens,
    accountAddress,
    mode,
    quoteInfo,
    isLoading: quoteLoading
  }) => {
    const [isOpen, setIsOpen] = useState(false);
    const { balance, isLoading: balanceLoading } = useTokenBalance(selectedToken?.address || '', accountAddress);
  
    const renderInputOrQuote = () => {
      if (mode === 'input') {
        return (
          <input
            type="number"
            placeholder="0.0"
            value={amount}
            onChange={(e) => onAmountChange?.(e.target.value)}
            className="w-full bg-transparent outline-none"
          />
        );
      } else {
        if (quoteLoading || !selectedToken) {
          return (
            <div className="text-gray-400">
              {quoteLoading ? 'Calculating...' : 'Select token and enter amount'}
            </div>
          );
        }
        return (
          <div className="space-y-1">
            <div className="text-lg">
              {quoteInfo?.buyAmount || '0.0'}
            </div>
            {quoteInfo?.buyAmountInUsd && (
              <div className="text-sm text-gray-400">
                ≈ ${quoteInfo.buyAmountInUsd.toFixed(2)}
              </div>
            )}
            {quoteInfo?.gasFeesInUsd && (
              <div className="text-xs text-gray-500">
                Gas Fee: ${quoteInfo.gasFeesInUsd.toFixed(4)}
              </div>
            )}
          </div>
        );
      }
    };
  
    return (
      <div className="space-y-2">
        <label className="text-sm text-gray-400">{label}</label>
        <div className="bg-slate-700 rounded-lg p-3 space-y-3">
          {renderInputOrQuote()}
          
          <div className="relative">
          <button
              onClick={() => setIsOpen(!isOpen)}
              className="w-full hover:bg-slate-600 transition-colors"
            >
              <div className="border-b border-slate-700 last:border-0">
                <div className="w-full p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {selectedToken ? (
                      <>
                        {selectedToken.logoUri && (
                          <img 
                            src={selectedToken.logoUri} 
                            alt={selectedToken.symbol} 
                            className="w-8 h-8 rounded-full"
                          />
                        )}
                        <div className="text-left">
                          <div className="font-medium">{selectedToken.symbol}</div>
                          {mode === 'input' && accountAddress && (
                            <div className="text-sm text-slate-400">
                              {balanceLoading ? 'Loading...' : balance ? `Balance: ${balance}` : 'Balance: 0'}
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="text-slate-400">Select token</div>
                    )}
                  </div>
                  <ChevronDown className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
              </div>
            </button>
  
            {isOpen && (
              <div className="absolute z-10 mt-2 w-full bg-slate-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {validTokens.map((token) => (
                  <TokenItem
                    key={token.address}
                    token={token}
                    accountAddress={accountAddress}
                    onClick={(token) => {
                      onTokenSelect(token);
                      setIsOpen(false);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  export default TokenSelector;