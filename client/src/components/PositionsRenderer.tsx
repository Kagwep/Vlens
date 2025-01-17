import { useState, useEffect } from 'react';
import { IPosition, IMarketAsset, RiskLevel } from '../type';
import { formatTokenAmount } from '../utils';

interface PositionRenderProps {
  positions: IPosition[];
  markets: IMarketAsset[];
  getMarketByAsset: (poolId: string, assetAddress: string) => IMarketAsset | undefined;
  calculateAPY: (market: IMarketAsset) => number;
  calculateMonthlyYield: (amount: string, market: IMarketAsset) => number;
  getRiskLevel: (position: IPosition) => Promise<RiskLevel>;
}

const getUSDPrice = (priceValue: string, decimals: number): number => {
    return Number(BigInt(priceValue)) / 10 ** decimals;
  };
  
  const RiskIndicator = ({ level }: { level: string }) => {
    const colors = {
      low: 'bg-green-500 text-green-200 border-green-700',
      medium: 'bg-yellow-500 text-yellow-200 border-yellow-700',
      high: 'bg-red-500 text-red-200 border-red-700',
      safe: 'bg-blue-500 text-blue-200 border-blue-700'
    };
  
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium border ${colors[level as keyof { low: string; medium: string; high: string; safe: string; }] || colors.medium}`}>
       
      </span>
    );
  };

const PositionCard = ({ 
  position, 
  market, 
  riskLevel,
  apy, 
  monthlyYield 
}: { 
  position: IPosition;
  market: IMarketAsset | undefined;
  riskLevel: RiskLevel;
  apy: number;
  monthlyYield: number;
}) => (
  <div className="bg-gray-800 rounded-xl shadow-xl overflow-hidden border border-gray-700">
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <p className="text-gray-200 font-medium">{position.collateral.symbol}</p>
            <RiskIndicator level={riskLevel} />
          </div>
          <p className="text-sm text-gray-400">
            {formatTokenAmount(position.collateral.value, position.collateral.decimals)}
          </p>
        </div>
        
        <div className="text-right">
          {position.collateral.usdPrice && (
            <p className="text-gray-200 font-medium">
              ${getUSDPrice(
                position.collateral.usdPrice.value, 
                position.collateral.usdPrice.decimals
              ).toFixed(4)}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 p-4 bg-gray-900 rounded-lg">
        {market && (
          <>
            <div className="space-y-1">
              <p className="text-sm text-gray-400">Supply APY</p>
              <p className="text-gray-200 font-medium">{apy.toFixed(4)}%</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-gray-400">Monthly Yield</p>
              <p className="text-gray-200 font-medium">${monthlyYield.toFixed(10)}</p>
            </div>
          </>
        )}

        {position.type === 'borrow' && position.ltv && (
          <>
            <div className="space-y-1">
              <p className="text-sm text-gray-400">Current LTV</p>
              <p className="text-gray-200 font-medium">
                {(Number(formatTokenAmount(
                  position.ltv.current.value, 
                  position.ltv.current.decimals
                )) * 100).toFixed(4)}%
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-400">Max LTV</p>
              <p className="text-gray-200 font-medium">
                {(Number(formatTokenAmount(
                  position.ltv.max.value, 
                  position.ltv.max.decimals
                )) * 100).toFixed(4)}%
              </p>
            </div>
          </>
        )}
      </div>

      {market?.risk?.url && (
        <div className="text-right">
          <a 
            href={market.risk.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center gap-1"
          >
            View Risk Report
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        </div>
      )}
    </div>
  </div>
);

const PositionsRenderer = (props: PositionRenderProps) => {
  const [positionRisks, setPositionRisks] = useState<Record<string, RiskLevel>>({});

  useEffect(() => {
    const loadRiskLevels = async () => {
      const risks: Record<string, RiskLevel> = {};
      
      for (const position of props.positions) {
        risks[position.collateral.address] = await props.getRiskLevel(position);
      }
      
      setPositionRisks(risks);
    };

    loadRiskLevels();
  }, [props.positions]);

  return (
    <div className="mt-8 space-y-4">
      <h2 className="text-xl font-semibold text-gray-200">Your Positions</h2>
      {props.positions.length === 0 ? (
        <p className="text-gray-400">No positions found</p>
      ) : (
        props.positions.map((position) => {
          const market = props.getMarketByAsset(position.pool.id, position.collateral.address);
          const apy = market ? props.calculateAPY(market) : 0;
          const monthlyYield = market ? props.calculateMonthlyYield(position.collateral.value, market) : 0;
          
          return (
            <PositionCard
              key={position.collateral.address}
              position={position}
              market={market}
              riskLevel={positionRisks[position.collateral.address] || 'medium'}
              apy={apy}
              monthlyYield={monthlyYield}
            />
          );
        })
      )}
    </div>
  );
};

export default PositionsRenderer;