// tests/test_supply.cairo
use snforge_std::{
    declare, ContractClassTrait, DeclareResultTrait, start_cheat_caller_address,
    test_address
};
use lens3::lens3::{
    ILendingWrapperDispatcher, ILendingWrapperDispatcherTrait,
    ISingletonDispatcher, ISingletonDispatcherTrait
};
use lens3::erc20::{IERC20Dispatcher, IERC20DispatcherTrait};
use starknet::{ contract_address_const};

use core::num::traits::Zero;

// Contract addresses on mainnet
const SINGLETON_ADDRESS: felt252 = 
    0x2545b2e5d519fc230e9cd781046d3a64e092114f07e44771e0d719d148725ef;
const POOL_ID: felt252 = 
    2198503327643286920898110335698706244522220458610657370981979460625005526824;

fn declare_and_deploy() -> ILendingWrapperDispatcher {
    let contract = declare("lending_wrapper").unwrap().contract_class();
    let (contract_address, _) = contract
        .deploy(@array![
            SINGLETON_ADDRESS
        ])
        .unwrap();
    ILendingWrapperDispatcher { contract_address }
}

fn setup() -> (ILendingWrapperDispatcher, IERC20Dispatcher, IERC20Dispatcher, u256) {
    // ETH as collateral
    let eth_address = contract_address_const::<
        0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7
    >();
    
    // USDC as debt token
    let usdc_address = contract_address_const::<
        0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8
    >();
    let eth_token = IERC20Dispatcher { contract_address: eth_address };
    let usdc_token = IERC20Dispatcher { contract_address: usdc_address };
    
    // Check initial balance
    let balance_before = eth_token.balanceOf(test_address());
    assert_eq!(balance_before, 0);

    let dispatcher = declare_and_deploy();
    let amount: u256 = 1000000000000000000; // 1 ETH
    
    // Verify Singleton has enough ETH
    let singleton_balance = eth_token.balanceOf(contract_address_const::<SINGLETON_ADDRESS>());
    assert(singleton_balance > amount.into(), 'needs more ETH');
    
    (dispatcher, eth_token, usdc_token, amount)
}

#[should_panic(expected: ('unauthorized',))]
#[test]
#[fork("MAINNET_FORK")]
fn test_access_supply() {
    let (dispatcher, eth_token, _, amount) = setup();
    let other_address = contract_address_const::<
        0x0576a87b1d9034d5d34a534c6151497dd1da44b986b1d94d0f42de317e1eef2c
    >();
    
    start_cheat_caller_address(dispatcher.contract_address, other_address);
    
    dispatcher.supply(
        POOL_ID,
        eth_token.contract_address,
        amount
    );
}

#[test]
#[fork("MAINNET_FORK")]
fn test_supply_success() {
    let (dispatcher, eth_token, _, amount) = setup();
    
    // Print initial state
    println!("Test starting with amount: {}", amount);
    
    // Check position before supply
    let singleton = ISingletonDispatcher { 
        contract_address: contract_address_const::<SINGLETON_ADDRESS>() 
    };
    let (position, _, _) = singleton.position(
        POOL_ID,
        eth_token.contract_address,
        Zero::zero(), // <-- Changed this
        test_address()
    );
    println!("Initial position - Collateral: {}", position.collateral_shares);

    // Do the supply
    eth_token.approve(dispatcher.contract_address, amount);

    let balance= eth_token.balanceOf(test_address());

    println!("balance {}", balance);


    dispatcher.supply(
        POOL_ID,
        eth_token.contract_address,
        amount
    );
    
    // Verify final position
    let (position_after, _, _) = singleton.position(
        POOL_ID,
        eth_token.contract_address,
        Zero::zero(), // <-- Changed this
        test_address()
    );
    assert(position_after.collateral_shares > position.collateral_shares, 'Supply failed');
}
#[should_panic(expected: ('Amount cannot be 0',))]
#[test]
#[fork("MAINNET_FORK")]
fn test_supply_zero() {
    let (dispatcher, eth_token, _, _) = setup();
    dispatcher.supply(
        POOL_ID,
        eth_token.contract_address,
        0.into()
    );
}