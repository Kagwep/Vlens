use starknet::ContractAddress;
use data_model::{UnsignedAmount, Amount, Context, AssetPrice};
use alexandria_math::i257::i257;

#[derive(Drop, Serde, Copy)]
struct LendingRequest {
    amount: u256,
    rate: u256,
    duration: u64,
    collateral_asset: ContractAddress,
    debt_asset: ContractAddress
}

#[derive(Drop, Serde, Copy)]
struct BorrowRequest {
    amount: u256,
    max_rate: u256,
    duration: u64,
    collateral_asset: ContractAddress,
    debt_asset: ContractAddress
}

#[starknet::interface]
trait IStorageAccess<TContractState> {
    // Lending requests
    fn get_lending_request(
        self: @TContractState, 
        user: ContractAddress, 
        pool_id: felt252
    ) -> LendingRequest;
    
    fn get_lending_request_count(self: @TContractState, user: ContractAddress) -> u32;
    
    fn set_lending_request(
        ref self: TContractState, 
        user: ContractAddress, 
        pool_id: felt252, 
        request: LendingRequest
    );

    // Borrowing requests
    fn get_borrowing_request(
        self: @TContractState, 
        user: ContractAddress, 
        pool_id: felt252
    ) -> BorrowRequest;
    
    fn get_borrowing_request_count(self: @TContractState, user: ContractAddress) -> u32;
    
    fn set_borrowing_request(
        ref self: TContractState, 
        user: ContractAddress, 
        pool_id: felt252, 
        request: BorrowRequest
    );

    // Matches
    fn get_match(
        self: @TContractState, 
        lender: ContractAddress, 
        borrower: ContractAddress
    ) -> bool;
    
    fn set_match(
        ref self: TContractState, 
        lender: ContractAddress, 
        borrower: ContractAddress, 
        is_matched: bool
    );
}

#[starknet::interface]
trait IExtension<TContractState> {
    fn singleton(self: @TContractState) -> ContractAddress;
    fn price(self: @TContractState, pool_id: felt252, asset: ContractAddress) -> AssetPrice;
    fn interest_rate(
        self: @TContractState,
        pool_id: felt252,
        asset: ContractAddress,
        utilization: u256,
        last_updated: u64,
        last_full_utilization_rate: u256,
    ) -> u256;
    fn rate_accumulator(
        self: @TContractState,
        pool_id: felt252,
        asset: ContractAddress,
        utilization: u256,
        last_updated: u64,
        last_rate_accumulator: u256,
        last_full_utilization_rate: u256,
    ) -> (u256, u256);
    fn before_modify_position(
        ref self: TContractState,
        context: Context,
        collateral: Amount,
        debt: Amount,
        data: Span<felt252>,
        caller: ContractAddress
    ) -> (Amount, Amount);
    fn after_modify_position(
        ref self: TContractState,
        context: Context,
        collateral_delta: i257,
        collateral_shares_delta: i257,
        debt_delta: i257,
        nominal_debt_delta: i257,
        data: Span<felt252>,
        caller: ContractAddress
    ) -> bool;
    fn before_transfer_position(
        ref self: TContractState,
        from_context: Context,
        to_context: Context,
        collateral: UnsignedAmount,
        debt: UnsignedAmount,
        data: Span<felt252>,
        caller: ContractAddress
    ) -> (UnsignedAmount, UnsignedAmount);
    fn after_transfer_position(
        ref self: TContractState,
        from_context: Context,
        to_context: Context,
        collateral_delta: u256,
        collateral_shares_delta: u256,
        debt_delta: u256,
        nominal_debt_delta: u256,
        data: Span<felt252>,
        caller: ContractAddress
    ) -> bool;
    fn before_liquidate_position(
        ref self: TContractState, context: Context, data: Span<felt252>, caller: ContractAddress
    ) -> (u256, u256, u256);
    fn after_liquidate_position(
        ref self: TContractState,
        context: Context,
        collateral_delta: i257,
        collateral_shares_delta: i257,
        debt_delta: i257,
        nominal_debt_delta: i257,
        bad_debt: u256,
        data: Span<felt252>,
        caller: ContractAddress
    ) -> bool;
}

#[starknet::contract]
mod P2PLendingExtension {
    use starknet::{ContractAddress, get_caller_address, get_block_timestamp};
    use data_model::{UnsignedAmount, Amount, Context, AssetPrice};
    use alexandria_math::i257::i257;
    use starknet::storage::{
        Map, StorageMapReadAccess, StorageMapWriteAccess, StoragePointerReadAccess,
        StoragePointerWriteAccess,
    };

 
    use super::{LendingRequest, BorrowRequest};

    #[storage]
    struct Storage {
        // Singleton address
        singleton: ContractAddress,
        // Track lending requests
        lending_requests: Map<(ContractAddress, felt252), LendingRequest>,  // (user, pool_id) -> request
        lending_request_count: Map<ContractAddress, u32>,
        // Track borrowing requests
        borrowing_requests: Map<(ContractAddress, felt252), BorrowRequest>,  // (user, pool_id) -> request
        borrowing_request_count: Map<ContractAddress, u32>,
        // Track active matches
        matches: Map<(ContractAddress, ContractAddress), bool>, // (lender, borrower) -> matched
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        LendingRequestCreated: LendingRequestCreated,
        BorrowRequestCreated: BorrowRequestCreated,
        MatchCreated: MatchCreated
    }

    #[derive(Drop, starknet::Event)]
    struct LendingRequestCreated {
        #[key]
        user: ContractAddress,
        amount: u256,
        rate: u256,
        duration: u64
    }

    #[derive(Drop, starknet::Event)]
    struct BorrowRequestCreated {
        #[key]
        user: ContractAddress,
        amount: u256,
        max_rate: u256,
        duration: u64
    }

    #[derive(Drop, starknet::Event)]
    struct MatchCreated {
        #[key]
        lender: ContractAddress,
        #[key]
        borrower: ContractAddress,
        amount: u256,
        rate: u256
    }

    #[constructor]
    fn constructor(ref self: ContractState, singleton_address: ContractAddress) {
        self.singleton.write(singleton_address);
    }

    // Implement the Extension interface
    #[abi(embed_v0)]
    impl ExtensionImpl of IExtension<ContractState> {
        fn singleton(self: @ContractState) -> ContractAddress {
            self.singleton.read()
        }
    
        // Simple price implementation - in a real system this would likely call an oracle
        fn price(self: @ContractState, pool_id: felt252, asset: ContractAddress) -> AssetPrice {
            AssetPrice { value: 1000000000000000000 } // Default to 1.0
        }
    
        // Basic interest rate calculation
        fn interest_rate(
            self: @ContractState,
            pool_id: felt252,
            asset: ContractAddress,
            utilization: u256,
            last_updated: u64,
            last_full_utilization_rate: u256,
        ) -> u256 {
            // Simple fixed rate for demonstration
            50000000000000000 // 5% APR
        }
    
        // Basic rate accumulator calculation
        fn rate_accumulator(
            self: @ContractState,
            pool_id: felt252,
            asset: ContractAddress,
            utilization: u256,
            last_updated: u64,
            last_rate_accumulator: u256,
            last_full_utilization_rate: u256,
        ) -> (u256, u256) {
            (last_rate_accumulator, last_full_utilization_rate)
        }
    
        fn before_modify_position(
            ref self: ContractState,
            context: Context,
            collateral: Amount,
            debt: Amount,
            data: Span<felt252>,
            caller: ContractAddress
        ) -> (Amount, Amount) {
            // Parse the request type from data
            if !data.is_empty() {
                let request_type = *data[0];
                
                // Handle lending request
                if request_type == 1 {  // 1 = lending request
                    self.handle_lending_request(
                        context.pool_id,
                        caller,
                        collateral,
                        data
                    );
                }
                // Handle borrowing request
                else if request_type == 2 {  // 2 = borrowing request
                    self.handle_borrowing_request(
                        context.pool_id,
                        caller,
                        debt,
                        data
                    );
                }
            }
            
            (collateral, debt)
        }
    
        fn after_modify_position(
            ref self: ContractState,
            context: Context,
            collateral_delta: i257,
            collateral_shares_delta: i257,
            debt_delta: i257,
            nominal_debt_delta: i257,
            data: Span<felt252>,
            caller: ContractAddress
        ) -> bool {
            // Simple implementation - return true to indicate success
            true
        }
    
        fn before_transfer_position(
            ref self: ContractState,
            from_context: Context,
            to_context: Context,
            collateral: UnsignedAmount,
            debt: UnsignedAmount,
            data: Span<felt252>,
            caller: ContractAddress
        ) -> (UnsignedAmount, UnsignedAmount) {
            (collateral, debt)
        }
    
        fn after_transfer_position(
            ref self: ContractState,
            from_context: Context,
            to_context: Context,
            collateral_delta: u256,
            collateral_shares_delta: u256,
            debt_delta: u256,
            nominal_debt_delta: u256,
            data: Span<felt252>,
            caller: ContractAddress
        ) -> bool {
            true
        }
    
        fn before_liquidate_position(
            ref self: ContractState,
            context: Context,
            data: Span<felt252>,
            caller: ContractAddress
        ) -> (u256, u256, u256) {
            // Return default values for liquidation parameters
            (100000000000000000, 100000000000000000, 100000000000000000)
        }
    
        fn after_liquidate_position(
            ref self: ContractState,
            context: Context,
            collateral_delta: i257,
            collateral_shares_delta: i257,
            debt_delta: i257,
            nominal_debt_delta: i257,
            bad_debt: u256,
            data: Span<felt252>,
            caller: ContractAddress
        ) -> bool {
            true
        }
    }
    
    #[generate_trait]
    impl InternalFunctions of InternalFunctionsTrait {
        fn handle_lending_request(
            ref self: ContractState,
            pool_id: felt252,
            lender: ContractAddress,
            amount: Amount,
            data: Span<felt252>
        ) {
            let request = LendingRequest {
                amount: amount.value.magnitude,
                rate: *data[1],
                duration: (*data[2]).try_into().unwrap(),
                collateral_asset: contract_address_try_from_felt252(*data[3]).unwrap(),
                debt_asset: contract_address_try_from_felt252(*data[4]).unwrap()
            };
    
            self.lending_requests.write((lender, pool_id), request);
            self.lending_request_count.write(lender, self.lending_request_count.read(lender) + 1);
    
            self.try_match_request(pool_id, lender, request);
    
            // Emit event
            self.emit(Event::LendingRequestCreated(LendingRequestCreated {
                user: lender,
                amount: request.amount,
                rate: request.rate,
                duration: request.duration
            }));
        }
    
        fn handle_borrowing_request(
            ref self: ContractState,
            pool_id: felt252,
            borrower: ContractAddress,
            amount: Amount,
            data: Span<felt252>
        ) {
            let request = BorrowRequest {
                amount: amount.value.magnitude,
                max_rate: *data[1],
                duration: (*data[2]).try_into().unwrap(),
                collateral_asset: contract_address_try_from_felt252(*data[3]).unwrap(),
                debt_asset: contract_address_try_from_felt252(*data[4]).unwrap()
            };
    
            self.borrowing_requests.write((borrower, pool_id), request);
            self.borrowing_request_count.write(borrower, self.borrowing_request_count.read(borrower) + 1);
    
            self.try_match_request(pool_id, borrower, request);
    
            // Emit event
            self.emit(Event::BorrowRequestCreated(BorrowRequestCreated {
                user: borrower,
                amount: request.amount,
                max_rate: request.max_rate,
                duration: request.duration
            }));
        }
    
        fn try_match_request(
            ref self: ContractState,
            pool_id: felt252,
            user: ContractAddress,
            request: LendingRequest
        ) {
            // Simple matching logic - just check if this is already matched
            let borrower = user;
            let lender = user;
            
            // Check if already matched
            let is_matched = self.matches.read((lender, borrower));
            if !is_matched {
                // Create match and emit event
                self.matches.write((lender, borrower), true);
                
                self.emit(Event::MatchCreated(MatchCreated {
                    lender,
                    borrower,
                    amount: request.amount,
                    rate: request.rate
                }));
            }
        }
    }
}