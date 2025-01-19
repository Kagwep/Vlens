import React, { useState } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { ByteArray, type Hash } from 'viem';

interface SwapExecutionProps {
  swapData: {
    deposit_actions: Array<{
      type: string;
      to_address: string;
      amount: number;
      amount_in_base_units: string;
      call_data: string;
      network: {
        name: string;
        display_name: string;
        chain_id: string;
        transaction_explorer_template: string;
        metadata: {
          evm_multicall_contract?: string;
        };
      };
      token: {
        symbol: string;
        display_asset: string;
        contract: string | null;
        decimals: number;
      };
      fee_token: {
        symbol: string;
        decimals: number;
      };
    }>;
    swap: {
      id: string;
      status: string;
      source_network: {
        name: string;
        display_name: string;
        chain_id: string;
        transaction_explorer_template: string;
        metadata: {
          evm_multicall_contract?: string;
        };
      };
      destination_network: {
        name: string;
        display_name: string;
      };
      destination_address: string;
    };
    quote: {
      receive_amount: number;
      min_receive_amount: number;
      blockchain_fee: number;
      service_fee: number;
      total_fee: number;
      total_fee_in_usd: number;
      avg_completion_time: string;
      slippage: number;
    };
  };
}

export default function SwapExecution({ swapData }: SwapExecutionProps) {
  const [status, setStatus] = useState<string>('disconnected');
  const [error, setError] = useState<string>('');
  const [txHash, setTxHash] = useState<string>('');

  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  const depositAction = swapData.deposit_actions[0];
  const sourceNetwork = swapData.swap.source_network;
  const destinationNetwork = swapData.swap.destination_network;

  const getExplorerLink = (hash: string) => {
    return sourceNetwork.transaction_explorer_template.replace('{0}', hash);
  };

  const executeSwap = async () => {
    try {
      if (!isConnected || !address || !walletClient) {
        throw new Error('Wallet not connected');
      }

      setStatus('connecting');
      setError('');

      // Check if we're on the right network
      const currentChain = await walletClient.getChainId();
      const requiredChainId = parseInt(sourceNetwork.chain_id);

      if (currentChain !== requiredChainId) {
        setStatus('switching_network');
        try {
          await walletClient.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${requiredChainId.toString(16)}` }],
          });
        } catch (switchError: any) {
          throw new Error(`Failed to switch to ${sourceNetwork.display_name}`);
        }
      }

      setStatus('executing');
      
      // Send the transaction
      const hash = await walletClient.sendTransaction({
        to: depositAction.to_address as `0x${string}`,
        data: depositAction.call_data as `0x${string}`,
        value: BigInt(depositAction.amount_in_base_units),
        account: address,
        kzg: undefined,
        chain: undefined
      }) as Hash;

      setTxHash(hash);
      setStatus('completed');

    } catch (err: any) {
      console.error('Swap execution failed:', err);
      setError(err.message || 'Failed to execute swap');
      setStatus('failed');
    }
  };

  const getStatusComponent = () => {
    switch (status) {
      case 'disconnected':
        return (
          <div className="text-gray-400 text-sm mb-4">
            Click below to execute the swap from {sourceNetwork.display_name} to {destinationNetwork.display_name}
          </div>
        );
      case 'connecting':
        return (
          <div className="flex items-center space-x-2 text-blue-400 mb-4">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
            <span>Preparing transaction...</span>
          </div>
        );
      case 'switching_network':
        return (
          <div className="flex items-center space-x-2 text-blue-400 mb-4">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
            <span>Switching to {sourceNetwork.display_name}...</span>
          </div>
        );
      case 'executing':
        return (
          <div className="flex items-center space-x-2 text-blue-400 mb-4">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
            <span>Executing swap...</span>
          </div>
        );
      case 'completed':
        return (
          <div className="text-green-400 mb-4">
            <div>Swap submitted successfully!</div>
            <div className="text-sm mt-2">
              <a 
                href={getExplorerLink(txHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300"
              >
                View transaction →
              </a>
            </div>
          </div>
        );
      case 'failed':
        return (
          <div className="text-red-400 mb-4">
            {error}
          </div>
        );
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="bg-gray-900 rounded-lg shadow-lg p-6">
        <div className="space-y-4">
          {/* Swap Details */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Complete Your Swap</h2>
            <span className="text-sm text-gray-400">ID: {swapData.swap.id}</span>
          </div>

          {/* Network Information */}
          <div className="text-sm text-gray-400">
            From {sourceNetwork.display_name} to {destinationNetwork.display_name}
          </div>

          {/* Action Required */}
          <div className="bg-gray-800 rounded-lg p-4 space-y-3">
            <div>
              <div className="text-sm text-gray-400">Required Action:</div>
              <div className="text-white text-lg">
                Send {depositAction.amount} {depositAction.token.symbol}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">You will receive:</span>
                <span className="text-white">{swapData.quote.receive_amount} {depositAction.token.symbol}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Minimum receive amount:</span>
                <span className="text-white">{swapData.quote.min_receive_amount} {depositAction.token.symbol}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Blockchain fee:</span>
                <span className="text-white">{swapData.quote.blockchain_fee} {depositAction.fee_token.symbol}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Service fee:</span>
                <span className="text-white">{swapData.quote.service_fee} {depositAction.fee_token.symbol}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Total fee:</span>
                <span className="text-white">
                  {swapData.quote.total_fee} {depositAction.fee_token.symbol}
                  <span className="text-gray-400 ml-2">(${swapData.quote.total_fee_in_usd.toFixed(2)})</span>
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Slippage:</span>
                <span className="text-white">{(swapData.quote.slippage * 100).toFixed(2)}%</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Estimated time:</span>
                <span className="text-white">{swapData.quote.avg_completion_time}</span>
              </div>
            </div>

            <div className="pt-2 text-sm">
              <div className="text-gray-400">Destination address:</div>
              <div className="text-white break-all">
                {swapData.swap.destination_address}
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="py-2">
            {getStatusComponent()}
          </div>

          {/* Action Button */}
          <button
            onClick={executeSwap}
            disabled={status === 'connecting' || status === 'executing' || status === 'switching_network'}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 
                     disabled:opacity-50 transition-colors"
          >
            {status === 'disconnected' && 'Execute Swap'}
            {status === 'connecting' && 'Preparing...'}
            {status === 'switching_network' && 'Switching Network...'}
            {status === 'executing' && 'Executing Swap...'}
            {status === 'completed' && 'Swap Submitted'}
            {status === 'failed' && 'Retry Swap'}
          </button>

          {/* Help Text */}
          <div className="text-sm text-gray-400">
            Make sure you have sufficient funds in your {sourceNetwork.display_name} wallet to cover the amount and network fees.
          </div>
        </div>
      </div>
    </div>
  );
}