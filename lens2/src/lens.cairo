use starknet::ContractAddress;
use lens2::jediswap;
use alexandria_math::i257::i257;
use lens2::erc20;


#[derive(Drop, Serde)]
pub struct UpdatePositionResponse {
    pub collateral_amount: u256,
    pub debt_amount: u256,
}

// structs.cairo
#[derive(Drop, Serde)]
pub struct Amount {
    pub value: i257,
    pub is_kernel_side: bool,
}

#[derive(Drop, Serde)]
pub struct ModifyPositionParams {
    pub pool_id: felt252,
    pub collateral_asset: ContractAddress,
    pub debt_asset: ContractAddress,
    pub user: ContractAddress,
    pub collateral: Amount,
    pub debt: Amount,
    pub data: Span<felt252>
}

#[starknet::interface]
pub trait IVesu<TContractState> {
    fn flash_loan(
        ref self: TContractState,
        receiver: ContractAddress,
        asset: ContractAddress,
        amount: u256,
        is_legacy: bool,
        data: Span<felt252>
    );
    
    fn check_collateralization(
        ref self: TContractState,
        pool_id: felt252,
        collateral_asset: ContractAddress,
        debt_asset: ContractAddress,
        user: ContractAddress
    ) -> (bool, u256, u256);

    fn modify_position(ref self: TContractState, params: ModifyPositionParams) -> UpdatePositionResponse;
}

#[starknet::interface]
pub trait ICollateralSwap<TContractState> {
    fn swap_collateral(
        ref self: TContractState,
        old_collateral: ContractAddress,
        new_collateral: ContractAddress,
        debt_token: ContractAddress,
        debt_amount: u256,
        min_collateral_amount: u256,
        swap_fee: felt252,
        intermediate_token: Option<ContractAddress>,
        intermediate_fee: Option<felt252>
    );

    fn on_flash_loan(
        ref self: TContractState,
        sender: ContractAddress,
        asset: ContractAddress,
        amount: u256,
        data: Span<felt252>
    );

    fn get_owner(self: @TContractState) -> ContractAddress;
}



#[starknet::contract]
pub mod collateral_swap {
    use starknet::{ContractAddress, get_caller_address, get_contract_address, get_block_timestamp};
    use core::num::traits::Zero;
    use starknet::storage::StoragePointerReadAccess;
    use starknet::storage::StoragePointerWriteAccess;
    use super::{IVesuDispatcherTrait, IVesuDispatcher};
    use super::erc20::{IERC20Dispatcher, IERC20DispatcherTrait};
    use super::jediswap::{
        IJediSwapV2SwapRouterDispatcher, 
        IJediSwapV2SwapRouterDispatcherTrait, 
        ExactInputParams
    };
    use super::{ModifyPositionParams,ICollateralSwap,Amount};
    use alexandria_math::i257::{i257,I257Trait,I257Impl};

    #[storage]
    struct Storage {
        vesu: IVesuDispatcher,
        jediswap: IJediSwapV2SwapRouterDispatcher,
        pool_id: felt252,
        owner: ContractAddress,
    }

    // Parameters for the swap operation
    #[derive(Drop, Serde)]
    struct SwapParams {
        old_collateral: ContractAddress,
        new_collateral: ContractAddress,
        debt_token: ContractAddress,
        debt_amount: u256,
        min_collateral_amount: u256,
        pool_id: felt252,
        swap_fee: felt252,
        intermediate_token: Option<ContractAddress>,  // Optional token for multi-hop swaps
        intermediate_fee: Option<felt252>            // Fee for second hop if needed
    }

    #[constructor]
    fn constructor(
        ref self: ContractState, 
        owner: ContractAddress,
        vesu: ContractAddress,
        jediswap: ContractAddress,
        pool_id: felt252
    ) {
        assert(!owner.is_zero(), 'owner is zero');
        self.owner.write(owner);
        self.vesu.write(IVesuDispatcher { contract_address: vesu });
        self.jediswap.write(IJediSwapV2SwapRouterDispatcher { contract_address: jediswap });
        self.pool_id.write(pool_id);
    }

    #[abi(embed_v0)]
    impl CollateralSwapImpl of ICollateralSwap<ContractState> {
        fn swap_collateral(
            ref self: ContractState,
            old_collateral: ContractAddress,
            new_collateral: ContractAddress,
            debt_token: ContractAddress,
            debt_amount: u256,
            min_collateral_amount: u256,
            swap_fee: felt252,
            intermediate_token: Option<ContractAddress>,
            intermediate_fee: Option<felt252>
        ) {
            let caller = get_caller_address();
            assert(caller == self.owner.read(), 'unauthorized');

            let pool_id = self.pool_id.read();
            
            // Check current collateralization before swap
            let vesu = self.vesu.read();
            let (is_safe, _, _) = vesu.check_collateralization(
                pool_id,
                old_collateral,
                debt_token,
                caller
            );
            assert(is_safe, 'position not safe');

            let params = SwapParams {
                old_collateral,
                new_collateral,
                debt_token,
                debt_amount,
                min_collateral_amount,
                pool_id,
                swap_fee,
                intermediate_token,
                intermediate_fee
            };

            let mut serialized: Array<felt252> = array![];
            Serde::serialize(@params, ref serialized);

            vesu.flash_loan(
                get_contract_address(),
                debt_token,
                debt_amount,
                false,
                serialized.span()
            );
        }

        fn on_flash_loan(
            ref self: ContractState,
            sender: ContractAddress,
            asset: ContractAddress,
            amount: u256,
            mut data: Span<felt252>
        ) {
            let vesu = self.vesu.read();
            assert(get_caller_address() == vesu.contract_address, 'unauthorized');
            assert(get_contract_address() == sender, 'unauthorized');

            let params: SwapParams = Serde::deserialize(ref data)
                .expect('invalid params');

            let owner = self.owner.read();

            // For closing positions (negative amount)
            let negative_value = if amount == 0 {
                I257Trait::new(amount, false)  // Zero case
            } else {
                I257Trait::new(amount,true)  // Negative case
            };

            // For opening positions (positive amount)
            let positive_value = if amount == 0 {
                I257Trait::new(amount, false)  // Zero case
            } else {
                I257Trait::new(amount,false)  // Positive case
            };


            // Close old position
            let close_params = ModifyPositionParams {
                pool_id: params.pool_id,
                collateral_asset: params.old_collateral,
                debt_asset: params.debt_token,
                user: owner,
                collateral: Amount { value: negative_value, is_kernel_side: true },
                debt: Amount { value: negative_value, is_kernel_side: true },
                data: array![].span()
            };
            
            let close_result = vesu.modify_position(close_params);
            let old_collateral_amount = close_result.collateral_amount;

            println!("Flash loan amount: {}", amount);
            println!("Old collateral amount: {}", old_collateral_amount);
        
            // Add safety check
            assert(old_collateral_amount > 0, 'no collateral retrieved');

            // Prepare JediSwap path based on whether we need an intermediate token
            let mut swap_path: Array<felt252> = array![];
            swap_path.append(params.old_collateral.into());
            
            match params.intermediate_token {
                Option::Some(intermediate) => {
                    // First hop: old_collateral -> intermediate
                    swap_path.append(params.swap_fee);
                    swap_path.append(intermediate.into());
                    
                    // Second hop: intermediate -> new_collateral
                    swap_path.append(params.intermediate_fee.unwrap());
                    swap_path.append(params.new_collateral.into());
                },
                Option::None => {
                    // Direct swap: old_collateral -> new_collateral
                    swap_path.append(params.swap_fee);
                    swap_path.append(params.new_collateral.into());
                }
            };

            let jediswap = self.jediswap.read();
            
            // Approve JediSwap to spend old collateral
            IERC20Dispatcher { contract_address: params.old_collateral }
                .approve(jediswap.contract_address, old_collateral_amount);

            let swap_params = ExactInputParams {
                path: swap_path,
                recipient: get_contract_address(),
                deadline: get_block_timestamp(),
                amount_in: old_collateral_amount,
                amount_out_minimum: params.min_collateral_amount
            };

            let new_collateral_amount = jediswap.exact_input(swap_params);

            // Open new position with new collateral
            let open_params = ModifyPositionParams {
                pool_id: params.pool_id,
                collateral_asset: params.new_collateral,
                debt_asset: params.debt_token,
                user: owner,
                collateral: Amount { 
                    value: I257Trait::new(new_collateral_amount, false), 
                    is_kernel_side: true 
                },
                debt: Amount { 
                    value: I257Trait::new(amount, false), 
                    is_kernel_side: true 
                },
                data: array![].span()
            };
            
            vesu.modify_position(open_params);

            // Verify new position safety
            let (is_safe, _, _) = vesu.check_collateralization(
                params.pool_id,
                params.new_collateral,
                params.debt_token,
                owner
            );
            assert(is_safe, 'new position unsafe');

            // Approve Vesu to take back flash loan
            IERC20Dispatcher { contract_address: params.debt_token }
                .approve(vesu.contract_address, amount);
        }

        fn get_owner(self: @ContractState) -> ContractAddress {
            self.owner.read()
        }
    }
}