import { Account, CallData, Call, uint256, cairo, BigNumberish, AccountInterface } from 'starknet';
import { RpcProvider } from 'starknet';
import axios from 'axios';
import { toHex, parseUnits } from 'viem';
import { QuoteResponse, SendAsyncFunction } from '../type';



class StarknetSwap {
  private provider: RpcProvider;
  private account: Account;
  private sendAsync: SendAsyncFunction;

  constructor(account: AccountInterface | Account, sendAsync: SendAsyncFunction) {
    this.provider = new RpcProvider({ nodeUrl: 'https://free-rpc.nethermind.io/mainnet-juno' });
    this.account = account as Account;
    this.sendAsync = sendAsync;
  }

  // Make getQuote public and typed
  public async getQuote(
    sellTokenAddress: string,
    buyTokenAddress: string,
    amount: string,
    sellTokenDecimals: number
  ): Promise<QuoteResponse> {
    const sellAmount = toHex(parseUnits(amount, sellTokenDecimals));
    console.log(`Converting ${amount} with ${sellTokenDecimals} decimals to: ${sellAmount}`);

    const url = `https://starknet.api.avnu.fi/swap/v2/quotes?sellTokenAddress=${sellTokenAddress}&buyTokenAddress=${buyTokenAddress}&sellAmount=${sellAmount}&size=1`;

    const response = await axios.get(url);
    return response.data[0];
  }

  // New method to execute swap with quoteId
  public async executeSwap(
    quoteId: string,
    slippage: number = 0.05
  ): Promise<string> {
    try {
      const calldata = await this.buildSwapCalldata(
        quoteId,
        slippage,
        true, // includeApprove
        this.account.address
      );
      const calls = this.convertToCall(calldata.calls);
      return await this.executeTransactions(calls);
    } catch (e) {
      console.error("An error occurred during token swap execution:", e);
      throw e;
    }
  }

  // Original swap method maintained for backward compatibility
  public async swap(
    fromTokenAddress: string,
    toTokenAddress: string,
    amount: string,
    fromDecimals: number,
    toDecimals: number
  ): Promise<string> {
    try {
      const quote = await this.getQuote(
        fromTokenAddress,
        toTokenAddress,
        amount,
        fromDecimals
      );
      return await this.executeSwap(quote.quoteId);
    } catch (e) {
      console.error("An error occurred during token swap:", e);
      throw e;
    }
  }

  private async buildSwapCalldata(
    quoteId: string,
    slippage: number,
    includeApprove: boolean,
    gasTokenAddress: string
  ): Promise<any> {
    const url = 'https://starknet.api.avnu.fi/swap/v2/build';
    const takerAddress = this.account.address;
    const data = {
      quoteId,
      takerAddress,
      slippage,
      gasTokenAddress,
      includeApprove
    };

    const response = await axios.post(url, data);
    return response.data;
  }

  private async executeTransactions(calls: Call[]): Promise<string> {
    const response = await this.sendAsync(calls);
    return response.transaction_hash;
  }

  private convertToCall(data: any[]): Call[] {
    return data.map(item => ({
      contractAddress: item.contractAddress,
      entrypoint: item.entrypoint,
      calldata: CallData.compile(item.calldata)
    }));
  }

  // Helper method for formatting
  public static formatTokenAmount(amount: string, decimals: number): string {
    try {
      return parseUnits(amount, decimals).toString();
    } catch (error) {
      console.error('Error formatting token amount:', error);
      return '0';
    }
  }
}

export default StarknetSwap;