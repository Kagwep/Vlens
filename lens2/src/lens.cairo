use starknet::ContractAddress;
use lens2::jediswap;
use alexandria_math::i257::i257;
use lens2::erc20;


#[derive(Drop, Serde)]
struct ModifyPositionParams {
    pool_id: felt252,
    collateral_asset: ContractAddress,
    debt_asset: ContractAddress,
    user: ContractAddress,
    collateral: Amount,
    debt: Amount,
    data: Span<felt252>
}

#[derive(Drop, Serde)]
struct Amount {
    amount_type: AmountType,
    denomination: AmountDenomination,
    value: i257
}

#[derive(Drop, Serde)]
enum AmountType {
    Delta,
    Target
}

#[derive(Drop, Serde)]
enum AmountDenomination {
    Native,
    Assets
}

#[derive(Drop, Serde)]
struct UpdatePositionResponse {
    collateral_delta: i257,
    collateral_shares_delta: i257,
    debt_delta: i257,
    nominal_debt_delta: i257
}

#[derive(PartialEq, Copy, Drop, Serde)]
pub struct Position {
    pub collateral_shares: u256, // packed as u128 [SCALE] 
    pub nominal_debt: u256, // packed as u123 [SCALE]
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
    use super::{AmountType,AmountDenomination};
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


            let close_params = ModifyPositionParams {
                pool_id: params.pool_id,
                collateral_asset: params.old_collateral,
                debt_asset: params.debt_token,
                user: owner,
                collateral: Amount {
                    amount_type: AmountType::Delta,
                    denomination: AmountDenomination::Assets,
                    value: -(amount.into())  // Negative for closing
                },
                debt: Amount {
                    amount_type: AmountType::Delta,
                    denomination: AmountDenomination::Assets,
                    value: -(amount.into())  // Negative for closing
                },
                data: array![].span()
            };
            
            let close_result = vesu.modify_position(close_params);
            let old_collateral_delta = close_result.collateral_delta;
            // Check we got collateral out (delta should be negative for withdrawal)
            assert(old_collateral_delta < 0.into(), 'no collateral retrieved');
            // Add safety check


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
            
            let withdrawal_amount = (-old_collateral_delta).try_into().unwrap();

            // Approve JediSwap to spend withdrawn collateral
            IERC20Dispatcher { contract_address: params.old_collateral }
                .approve(jediswap.contract_address, I257Trait::abs(withdrawal_amount));
            
            let swap_params = ExactInputParams {
                path: swap_path,
                recipient: get_contract_address(),
                deadline: get_block_timestamp(),
                amount_in: I257Trait::abs(withdrawal_amount),  // Using converted delta amount
                amount_out_minimum: params.min_collateral_amount
            };

            let new_collateral_amount = jediswap.exact_input(swap_params);

            let open_params = ModifyPositionParams {
                pool_id: params.pool_id,
                collateral_asset: params.new_collateral,
                debt_asset: params.debt_token,
                user: owner,
                collateral: Amount {
                    amount_type: AmountType::Delta,
                    denomination: AmountDenomination::Assets,
                    value: new_collateral_amount.into()
                },
                debt: Amount {
                    amount_type: AmountType::Delta,
                    denomination: AmountDenomination::Assets,
                    value: amount.into()
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