// services/VesuEarnService.ts
import { 
    BigNumberish, 
    Call, 
    AccountInterface, 
    Account,
    CallData,
    Contract,
    Provider
} from 'starknet';
import type { Amount, EarnPositionInfo, Position, AssetConfig } from '../type';
import { ERC20ABI } from '../constants';


interface DepositParams {
    poolId: BigNumberish;
    asset: string;
    amount: BigNumberish;
}

class VesuEarnService {
    private contract: Contract;
    public provider: Provider;
    private account: Account;
    private sendAsync: (calls: Call[]) => Promise<{ transaction_hash: string }>;

    constructor(
        contractAddress: string,
        abi: any,
        account: AccountInterface | Account,
        sendAsync: (calls: Call[]) => Promise<{ transaction_hash: string }>
    ) {
        this.provider = new Provider({ nodeUrl: 'https://free-rpc.nethermind.io/mainnet-juno' });
        this.contract = new Contract(abi, contractAddress, this.provider);
        this.account = account as Account;
        this.sendAsync = sendAsync;
    }

    /**
     * Get user's current earn position
     */
    async getUserPosition(poolId: BigNumberish, asset: string): Promise<Position> {
        try {
            const { result: position } = await this.contract.get_position(
                poolId,
                this.account.address,
                asset
            );
            return position;
        } catch (error) {
            console.error('Error getting user position:', error);
            throw error;
        }
    }

    /**
     * Get asset configuration
     */
    async getAssetConfig(poolId: BigNumberish, asset: string): Promise<AssetConfig> {
        try {
            const { result: config } = await this.contract.get_asset_config(poolId, asset);
            return config;
        } catch (error) {
            console.error('Error getting asset config:', error);
            throw error;
        }
    }

    /**
     * Get current APY for an asset
     */
    async getCurrentApy(poolId: BigNumberish, asset: string): Promise<BigNumberish> {
        try {
            const config = await this.getAssetConfig(poolId, asset);
            const currentTime = BigInt(Math.floor(Date.now() / 1000));
            
            const { result: apy } = await this.contract.calculate_apy(
                poolId,
                asset,
                config.last_rate_accumulator,
                currentTime,
                config.last_updated
            );
            
            return apy;
        } catch (error) {
            console.error('Error calculating APY:', error);
            throw error;
        }
    }

    /**
     * Get detailed position information using multicall
     */
    async getPositionInfo(poolId: BigNumberish, asset: string): Promise<EarnPositionInfo> {
        try {
            // Read position
            const position = await this.contract.get_position(
                poolId, 
                this.account.address, 
                asset
            );
    
            // Read config
            const config = await this.contract.get_asset_config(poolId, asset);
    
            // Calculate APY
            const currentTime = BigInt(Math.floor(Date.now() / 1000));
            const apy = await this.contract.calculate_apy(
                poolId,
                asset,
                config.last_rate_accumulator,
                currentTime,
                config.last_updated
            );
    
            // Calculate earned amount
            const earnedAmount = await this.contract.calculate_earned_amount(
                poolId,
                asset,
                position,
                config
            );
    
            return {
                depositedAmount: position.collateral_shares,
                earnedAmount,
                totalShares: position.collateral_shares,
                apy
            };
        } catch (error) {
            console.error('Error getting position info:', error);
            throw error;
        }
    }
    /**
     * Get current rate
     */
    async getCurrentRate(poolId: BigNumberish, asset: string): Promise<BigNumberish> {
        try {
            const { result: rate } = await this.contract.get_current_rate(poolId, asset);
            return rate;
        } catch (error) {
            console.error('Error getting current rate:', error);
            throw error;
        }
    }

    /**
     * Get maximum deposit amount
     */
    async getMaxDeposit(poolId: BigNumberish, asset: string): Promise<BigNumberish> {
        try {
            const { result: maxDeposit } = await this.contract.get_max_deposit(poolId, asset);
            return maxDeposit;
        } catch (error) {
            console.error('Error getting max deposit:', error);
            throw error;
        }
    }

    /**
     * Deposit assets to earn
     */
    async deposit(params: DepositParams): Promise<string> {
        try {
            const { poolId, asset, amount } = params;

            // Check and build approval if needed
            const approvalCall = await this.buildApprovalCallIfNeeded(asset, amount);

            // Build deposit call
            const depositCall: Call = {
                contractAddress: this.contract.address,
                entrypoint: 'deposit',
                calldata: CallData.compile([poolId, asset, amount])
            };

            // Combine calls if approval is needed
            const calls = approvalCall ? [approvalCall, depositCall] : [depositCall];

            // Execute transaction(s)
            const { transaction_hash } = await this.sendAsync(calls);
            return transaction_hash;
        } catch (error) {
            console.error('Error depositing:', error);
            throw error;
        }
    }

    // Private helper methods
    private async calculateEarnedAmount(
        poolId: BigNumberish,
        asset: string,
        position: Position,
        config: AssetConfig
    ): Promise<BigNumberish> {
        try {
            const { result: earnedAmount } = await this.contract.calculate_earned_amount(
                poolId,
                asset,
                position,
                config
            );
            return earnedAmount;
        } catch (error) {
            console.error('Error calculating earned amount:', error);
            throw error;
        }
    }

    private async buildApprovalCallIfNeeded(
        asset: string,
        amount: BigNumberish
    ): Promise<Call | null> {
        try {
            const erc20 = new Contract(ERC20ABI, asset, this.provider);
            
            // Get current allowance
            const { result: allowance } = await erc20.allowance(
                this.account.address,
                this.contract.address
            );

            // If allowance is sufficient, return null
            if (allowance >= amount) {
                return null;
            }

            // Build approval call
            return {
                contractAddress: asset,
                entrypoint: 'approve',
                calldata: CallData.compile([this.contract.address, amount])
            };
        } catch (error) {
            console.error('Error building approval call:', error);
            throw error;
        }
    }
}

export default VesuEarnService;