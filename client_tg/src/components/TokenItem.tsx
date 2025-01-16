import { useTokenBalance } from "../hooks/useTokenBalance";
import { TokenItemProps } from "../type";

const TokenItem: React.FC<TokenItemProps> = ({ token, accountAddress, onClick }) => {
    const { balance, isLoading } = useTokenBalance(token.address, accountAddress);
    console.log(balance)
  
    return (
<button
        className="w-full flex items-center justify-between hover:bg-slate-600 transition-colors"
        onClick={() => onClick(token)}
      >
        <div className="border-b border-slate-700 last:border-0 w-full">
          <div className="w-full p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {token.logoUri && (
                <img 
                  src={token.logoUri} 
                  alt={token.symbol} 
                  className="w-8 h-8 rounded-full"
                />
              )}
              <div className="text-left">
                <div className="font-medium">{token.symbol}</div>
                {accountAddress && (
                  <div className="text-sm text-slate-400">
                    {isLoading ? 'Loading...' : balance ? balance : '0'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </button>
    );
  };
  

  export default TokenItem;