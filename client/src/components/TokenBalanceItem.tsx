import { useTokenBalance } from "../hooks/useTokenBalance";
import { Token } from "../type";

const TokenBalanceItem: React.FC<{
    token: Token;
    accountAddress: string;
  }> = ({ token, accountAddress }) => {
    const { balance, isLoading } = useTokenBalance(token.address, accountAddress);
  
    return (
      <div className="border-b border-slate-700 last:border-0">
        <div className="w-full p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {token.logoUri && (
              <img src={token.logoUri} alt={token.symbol} className="w-8 h-8 rounded-full" />
            )}
            <div className="text-left">
              <div className="font-medium">{token.symbol}</div>
              <div className="text-sm text-slate-400">
                {isLoading ? 'Loading...' : balance ? `${balance}` : '0'}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  export default TokenBalanceItem;