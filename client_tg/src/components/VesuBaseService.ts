// services/VesuBaseService.ts
import { 
    Account, 
    Contract, 
    CallData, 
    Call, 
    AccountInterface,
    BigNumberish,
    RpcProvider
} from 'starknet';
import type { Position, AssetConfig, Amount } from '../type';

export type SendAsyncFunction = (calls: Call[]) => Promise<{ transaction_hash: string }>;

class VesuBaseService {
    public provider: RpcProvider;
    protected account: Account;
    protected contract: Contract;
    protected sendAsync: SendAsyncFunction;

    constructor(
        contractAddress: string,
        abi: any,
        account: AccountInterface | Account,
        sendAsync: SendAsyncFunction
    ) {
        this.provider = new RpcProvider({ 
            nodeUrl: 'https://free-rpc.nethermind.io/mainnet-juno' 
        });
        this.account = account as Account;
        this.contract = new Contract(abi, contractAddress, this.provider);
        this.sendAsync = sendAsync;
    }

    // Read methods based on contract interface
    protected async getPairs(
        poolId: BigNumberish,
        collateralAsset: string,
        debtAsset: string
    ) {
        try {
            return await this.contract.pairs(
                poolId,
                collateralAsset,
                debtAsset
            );
        } catch (error) {
            console.error('Error getting pairs:', error);
            throw error;
        }
    }

    protected async getFeeConfig(poolId: BigNumberish) {
        try {
            return await this.contract.fee_config(poolId);
        } catch (error) {
            console.error('Error getting fee config:', error);
            throw error;
        }
    }

    protected async getInterestRateConfig(
        poolId: BigNumberish,
        asset: string
    ) {
        try {
            return await this.contract.interest_rate_config(
                poolId,
                asset
            );
        } catch (error) {
            console.error('Error getting interest rate config:', error);
            throw error;
        }
    }

    // Rest of the base functionality remains the same
    protected async executeTransaction(calls: Call[]): Promise<string> {
        try {
            const response = await this.sendAsync(calls);
            return response.transaction_hash;
        } catch (error) {
            console.error('Error executing transaction:', error);
            throw error;
        }
    }

    protected convertToCall(data: any[]): Call[] {
        return data.map(item => ({
            contractAddress: item.contractAddress,
            entrypoint: item.entrypoint,
            calldata: CallData.compile(item.calldata)
        }));
    }

    protected async buildTxCall(
        method: string,
        args: any[]
    ): Promise<Call> {
        return {
            contractAddress: this.contract.address,
            entrypoint: method,
            calldata: CallData.compile(args)
        };
    }

    protected validateAddress(address: string): boolean {
        return address.startsWith('0x') && address.length === 66;
    }

    protected formatAmount(
        amount: string | number,
        decimals: number
    ): BigNumberish {
        const value = typeof amount === 'string' ? 
            parseFloat(amount) : amount;
        return BigInt(Math.floor(value * 10 ** decimals));
    }
}

export default VesuBaseService;