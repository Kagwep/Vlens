import { useAccount } from "@starknet-react/core";
import { Token } from "../type";
import { ChevronDown, Wallet } from "lucide-react";
import TokenBalanceItem from "./TokenBalanceItem";
import { useState } from "react";

const BalancesAccordion: React.FC<{
  validTokens: Token[];
}> = ({ validTokens }) => {
  const { address: accountAddress } = useAccount();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!accountAddress) return null;

  return (
    <div className="bg-slate-800 rounded-lg overflow-hidden">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between border-b border-slate-700 hover:bg-slate-700/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-cyan-500" />
          <h2 className="text-lg font-semibold">Balances</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-sm text-slate-400">
            {validTokens.length} tokens
          </div>
          <ChevronDown 
            className={`w-5 h-5 transition-transform duration-200 ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {/* Collapsible content */}
      <div 
        className={`transition-all duration-200 ease-in-out ${
          isExpanded ? 'opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800">
          {validTokens.map((token) => (
            <TokenBalanceItem
              key={token.address}
              token={token}
              accountAddress={accountAddress}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default BalancesAccordion;