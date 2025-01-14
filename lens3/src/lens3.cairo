use starknet::ContractAddress;
use alexandria_math::i257::i257;
/// Interface for the lending wrapper contract
#[starknet::interface]
pub trait ILendingWrapper<TContractState> {
    fn supply(
        ref self: TContractState,
        pool_id: felt252,
        token: ContractAddress,
        amount: u256
    );

    fn borrow(
        ref self: TContractState,
        pool_id: felt252,
        collateral_token: ContractAddress,
        borrow_token: ContractAddress,
        borrow_amount: u256
    );
}

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
pub trait ISingleton<TContractState> {
    fn modify_position(
        ref self: TContractState, 
        params: ModifyPositionParams
    ) -> UpdatePositionResponse;
    fn position(
        ref self: TContractState,
        pool_id: felt252,
        collateral_asset: ContractAddress,
        debt_asset: ContractAddress,
        user: ContractAddress
    ) -> (Position, u256, u256);
}



/// Wrapper contract for simplified lending operations
#[starknet::contract]
pub mod lending_wrapper {
    use super::ISingletonDispatcherTrait;
    use core::traits::Into;
    use starknet::{ContractAddress, get_caller_address};
    use super::{ISingletonDispatcher,ModifyPositionParams,Amount,AmountType,AmountDenomination};
    use starknet::storage::StoragePointerReadAccess;
    use starknet::storage::StoragePointerWriteAccess;
    use core::num::traits::Zero;
    use lens3::erc20::{IERC20Dispatcher, IERC20DispatcherTrait};

    #[storage]
    struct Storage {
        singleton: ContractAddress
    }

    #[constructor]
    fn constructor(ref self: ContractState, singleton_address: ContractAddress) {
        self.singleton.write(singleton_address);
    }

    #[abi(embed_v0)]
    impl LendingWrapperImpl of super::ILendingWrapper<ContractState> {
        fn supply(
            ref self: ContractState,
            pool_id: felt252,
            token: ContractAddress,
            amount: u256
        ) {
            // Assert non-zero amount
            assert(amount.low != 0 || amount.high != 0, 'Amount cannot be 0');
            
            let caller = get_caller_address();

            let erc20 = IERC20Dispatcher { contract_address: token };
            erc20.approve(self.singleton.read(), amount);
      
            // Create supply parameters
            let params = ModifyPositionParams {
                pool_id,
                collateral_asset: token,
                debt_asset: Zero::zero(), // <-- Changed this to use zero address
                user: caller,
                collateral: Amount {
                    amount_type: AmountType::Delta,
                    denomination: AmountDenomination::Assets,
                    value: amount.into()  
                },
                debt: Amount {
                    amount_type: AmountType::Delta,
                    denomination: AmountDenomination::Assets,
                    value: 0.into()
                },
                data: array![].span()
            };
        
            let singleton = ISingletonDispatcher { 
                contract_address: self.singleton.read() 
            };


            singleton.modify_position(params);

           
        }
        fn borrow(
            ref self: ContractState,
            pool_id: felt252,
            collateral_token: ContractAddress,
            borrow_token: ContractAddress,
            borrow_amount: u256
        ) {
               // Assert non-zero amount
            assert(borrow_amount.low != 0 || borrow_amount.high != 0, 'Amount cannot be 0');
            assert(collateral_token != borrow_token, 'Same token not allowed');
            
            let caller = get_caller_address();
            
            let params = ModifyPositionParams {
                pool_id,
                collateral_asset: collateral_token,
                debt_asset: borrow_token,
                user: caller,
                collateral: Amount {
                    amount_type: AmountType::Delta,
                    denomination: AmountDenomination::Assets,  // Changed from Native
                    value: 0.into()
                },
                debt: Amount {
                    amount_type: AmountType::Delta,
                    denomination: AmountDenomination::Assets,  // Changed from Native
                    value: borrow_amount.into()
                },
                data: array![].span()
            };

            // Call singleton contract
            let singleton = ISingletonDispatcher { 
                contract_address: self.singleton.read() 
            };
            singleton.modify_position(params);
        }
    }
}