import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowRightCircle } from 'lucide-react';
import SwapExecution from './SwapExecutionProps';
import toast from 'react-hot-toast';

interface Token {
  symbol: string;
  display_asset: string;
  logo: string;
  contract: string | null;
  decimals: number;
  price_in_usd: number;
  precision: number;
  listing_date: string;
  source_rank: number;
  destination_rank: number;
}

interface NetworkData {
  tokens: Token[];
  name: string;
  display_name: string;
  chain_id: string;
  logo: string;
  node_url: string;
  type: string;
  transaction_explorer_template: string;
  account_explorer_template: string;
  token: Token;
  metadata: {
    listing_date: string;
    evm_oracle_contract: string;
  };
}

interface NetworksResponse {
  [key: string]: NetworkData;
}

export default function LayerSwapInterface() {
  const [networks, setNetworks] = useState<NetworksResponse | null>(null);
  const [sourceTokens, setSourceTokens] = useState<Token[]>([]);
  const [destinationTokens, setDestinationTokens] = useState<Token[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [swapLoading, setSwapLoading] = useState(false);
  const [swapData, setSwapData] = useState(null);
  const [formData, setFormData] = useState({
    source: '',
    destination: 'STARKNET_MAINNET',
    sourceToken: '',
    destinationToken: '',
    amount: '',
    destination_address: '',
    refuel: false,
  });
  const [swapDest, setSwapDest] = useState();

  useEffect(() => {
    const fetchNetworks = async () => {
      try {
        setIsLoading(true);
        setError('');
        const options = {
          method: 'GET',
          url: 'https://api.layerswap.io/api/v2/networks',
          headers: {
            'accept': 'application/json',
            'content-type': 'application/json',
            'X-LS-APIKEY': import.meta.env.VITE_LAYER
          }
        };

        const { data } = await axios.request(options);
        setNetworks(data.data);

        //console.log(data.data)

        Object.entries(data.data).forEach(([key, network]) => {
          if ((network as NetworkData).name === "STARKNET_MAINNET") {
            setSwapDest(key as any); // Pass the [key, network] directly
            setDestinationTokens((network as NetworkData).tokens);
          }
        });
        
      
      } catch (error) {
        setError('Failed to load networks');
        console.error('Error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchNetworks();
  }, []);

  const handleNetworkChange = (e: React.ChangeEvent<HTMLSelectElement>, type: 'source' | 'destination') => {
    const network = networks?.[e.target.value];
    if (network) {
      if (type === 'source') {
        setSourceTokens(network.tokens);
        setFormData(prev => ({ ...prev, source: e.target.value, sourceToken: '' }));
      } else {
        setDestinationTokens(network.tokens);
        setFormData(prev => ({ ...prev, destination: e.target.value, destinationToken: '' }));
      }
    }
  };

  const handleCreateSwap = async () => {
    if (!formData.source || !formData.destination || !formData.sourceToken || !formData.amount || !formData.destination_address) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSwapLoading(true);
    if (!networks || !swapDest) return;

    console.log(formData)
    
    try {
      const options = {
        method: 'POST',
        url: 'https://api.layerswap.io/api/v2/swaps',
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
          'X-LS-APIKEY': import.meta.env.VITE_LAYER
        },
        data: {
          destination_address: formData.destination_address,
          reference_id: null,
          source_network: networks[formData.source].name,
          source_token: formData.sourceToken,
          destination_network: networks[swapDest].name,
          destination_token: formData.destinationToken || formData.sourceToken,
          refuel: formData.refuel,
          use_deposit_address: false,
          use_new_deposit_address: null,
          amount: parseFloat(formData.amount),
          source_address: null,
          slippage: null
        }
      };

      const { data } = await axios.request(options);
      console.log('Swap created:', data);
      handleSwapCreated(data);
      toast.success('Swap created successfully!');
    } catch (error) {
      console.error('Error creating swap:', error);
      toast.error('Failed to create swap. Please try again.');
    } finally {
      setSwapLoading(false);
    }
  };

  const handleSwapCreated = (response: any) => {
    setSwapData(response.data);
  };

  if (isLoading || !networks) {
    return (
      <div className="max-w-2xl mx-auto p-4 flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="bg-gray-900 rounded-lg shadow-lg p-6">
        <div className="space-y-4">
          {/* Source Network Selection */}
          <div className="bg-gray-800 rounded-lg p-4">
            <label className="block text-sm text-gray-400 mb-2">From</label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <select
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.source}
                  onChange={(e) => handleNetworkChange(e, 'source')}
                >
                  <option value="">Select Network</option>
                  {Object.entries(networks).map(([key, network]) => (
                    <option key={key} value={key}>
                      {network.display_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <select
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.sourceToken}
                  onChange={(e) => setFormData(prev => ({ ...prev, sourceToken: e.target.value }))}
                  disabled={!formData.source}
                >
                  <option value="">Select Token</option>
                  {sourceTokens.map((token) => (
                    <option key={token.symbol} value={token.symbol}>
                      {token.display_asset} (${token.price_in_usd.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <button className="p-2 bg-gray-700 rounded-full">
              <ArrowRightCircle className="h-6 w-6 text-blue-400" />
            </button>
          </div>

          {/* Destination Network Selection */}
          <div className="bg-gray-800 rounded-lg p-4">
            <label className="block text-sm text-gray-400 mb-2">To</label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <select
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.destination}
                  disabled
                >
                  <option value="STARKNET_MAINNET">
                    {Object.entries(networks)
                      .find(([key]) => key === "STARKNET_MAINNET")?.[1]?.display_name || "Starknet"}
                  </option>
                </select>
              </div>
              <div>
                <select
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.destinationToken}
                  onChange={(e) => setFormData(prev => ({ ...prev, destinationToken: e.target.value }))}
                >
                  <option value="">Select Token</option>
                  {destinationTokens.map((token) => (
                    <option key={token.symbol} value={token.symbol}>
                      {token.display_asset} (${token.price_in_usd.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Amount</label>
            <input
              type="number"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.0"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Send To</label>
            <input
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Address"
              value={formData.destination_address}
              onChange={(e) => setFormData(prev => ({ ...prev, destination_address: e.target.value }))}
            />
          </div>

          <button
            onClick={handleCreateSwap}
            disabled={swapLoading}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
          >
            {swapLoading ? 'Creating Swap...' : 'Create Swap'}
          </button>
        </div>
      </div>
      {swapData && <SwapExecution swapData={swapData} />}
    </div>
  );
}