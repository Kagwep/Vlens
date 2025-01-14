use snforge_std::{
    declare, ContractClassTrait, DeclareResultTrait, start_cheat_caller_address,
    stop_cheat_caller_address, spy_events, EventSpyAssertionsTrait,test_address
};
use lens2::lens::{
    collateral_swap, ICollateralSwapDispatcher, ICollateralSwapDispatcherTrait,IVesuDispatcherTrait, IVesuDispatcher
    
};
use lens2::erc20::{IERC20Dispatcher, IERC20DispatcherTrait};
use starknet::{ContractAddress, contract_address_const};

// Contract addresses on mainnet
const VESU_SINGLETON_ADDRESS: felt252 = 
    0x2545b2e5d519fc230e9cd781046d3a64e092114f07e44771e0d719d148725ef;
const JEDISWAP_ROUTER_ADDRESS: felt252 = 
    0x0359550b990167afd6635fa574f3bdadd83cb51850e1d00061fe693158c23f80;

fn declare_and_deploy() -> ICollateralSwapDispatcher {
    let contract = declare("collateral_swap").unwrap().contract_class();
    let (contract_address, _) = contract
        .deploy(@array![
            test_address().into(), 
            VESU_SINGLETON_ADDRESS, 
            JEDISWAP_ROUTER_ADDRESS,
            2198503327643286920898110335698706244522220458610657370981979460625005526824
        ])
        .unwrap();

    ICollateralSwapDispatcher { contract_address }
}

fn setup() -> (ICollateralSwapDispatcher, IERC20Dispatcher, IERC20Dispatcher, u256) {
    // ETH as original collateral
    let eth_address = contract_address_const::<
        0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7
    >();
    
    // USDC as target collateral
    let usdc_address = contract_address_const::<
        0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8
    >();

    let eth_token = IERC20Dispatcher { contract_address: eth_address };
    let usdc_token = IERC20Dispatcher { contract_address: usdc_address };
    
    // Check initial balance
    let balance_before = eth_token.balanceOf(test_address());
    assert_eq!(balance_before, 0);

    let dispatcher = declare_and_deploy();
    assert_eq!(dispatcher.get_owner(), test_address());

    let amount: u256 = 1000000000000000000; // 1 ETH
    
    // Verify Vesu has enough ETH
    let vesu_balance = eth_token.balanceOf(contract_address_const::<VESU_SINGLETON_ADDRESS>());
    assert(vesu_balance > amount.into(), 'needs more ETH');

    (dispatcher, eth_token, usdc_token, amount)
}

#[should_panic(expected: ('unauthorized',))]
#[test]
#[fork("MAINNET_FORK")]
fn test_access_swap() {
    let (dispatcher, eth_token, usdc_token, amount) = setup();
    let other_address = contract_address_const::<
        0x0576a87b1d9034d5d34a534c6151497dd1da44b986b1d94d0f42de317e1eef2c
    >();

    start_cheat_caller_address(dispatcher.contract_address, other_address);
    assert_ne!(other_address, test_address());
    assert_eq!(dispatcher.get_owner(), test_address());
    
    dispatcher.swap_collateral(
        eth_token.contract_address,
        usdc_token.contract_address,
        usdc_token.contract_address,
        amount,
        1900000000, // min USDC out
        3000,       // 0.3% fee
        Option::None,
        Option::None
    );
}

#[should_panic(expected: ('unauthorized',))]
#[test]
#[fork("MAINNET_FORK")]
fn test_access_callback() {
    let (dispatcher, eth_token, _, amount) = setup();
    let other_address = contract_address_const::<
        0x0576a87b1d9034d5d34a534c6151497dd1da44b986b1d94d0f42de317e1eef2c
    >();

    start_cheat_caller_address(dispatcher.contract_address, other_address);
    assert_ne!(other_address, test_address());
    assert_eq!(dispatcher.get_owner(), test_address());
    
    dispatcher.on_flash_loan(
        test_address(), 
        eth_token.contract_address, 
        amount, 
        array![].span()
    );
}

#[should_panic(expected: ('position not safe',))]
#[test]
#[fork("MAINNET_FORK")]
fn test_collateral_swap() {
    let (dispatcher, eth_token, usdc_token, amount) = setup();
    
    dispatcher.swap_collateral(
        eth_token.contract_address,
        usdc_token.contract_address,
        usdc_token.contract_address,
        amount,
        1900000000,  // Expect at least 1900 USDC out
        3000,        // 0.3% fee
        Option::None,
        Option::None
    );
    
    let balance_after = eth_token.balanceOf(test_address());
    assert_eq!(balance_after, 0);
}

#[test]
#[fork("MAINNET_FORK")]
fn test_direct_swap() {
    let (dispatcher, eth_token, usdc_token, amount) = setup();
    
    // Print initial state
    println!("Test starting with amount: {}", amount);
    
    // Check position before swap
    let vesu = IVesuDispatcher { contract_address: contract_address_const::<
        VESU_SINGLETON_ADDRESS
    >() };
    let (is_safe, coll, debt) = vesu.check_collateralization(
        2198503327643286920898110335698706244522220458610657370981979460625005526824, // pool_id
        eth_token.contract_address,
        usdc_token.contract_address,
        test_address()
    );
    println!("Initial position - Safe: {}, Collateral: {}, Debt: {}", is_safe, coll, debt);

    dispatcher.swap_collateral(
        eth_token.contract_address,
        usdc_token.contract_address,
        usdc_token.contract_address,
        amount,
        1900000000,  // min USDC out
        3000,        // fee
        Option::None,
        Option::None
    );
}
#[test]
#[fork("MAINNET_FORK")]
fn test_multi_hop_swap() {
    let (dispatcher, eth_token, usdc_token, amount) = setup();
    
    // WBTC address for intermediate hop
    let wbtc_address = contract_address_const::<
        0x03fe2b97c1fd336e750087d68b9b867997fd64a2661ff3ca5a7c771641e8e7ac
    >();
    
    dispatcher.swap_collateral(
        eth_token.contract_address,
        usdc_token.contract_address,
        usdc_token.contract_address,
        amount,
        1900000000,  // min USDC out
        3000,        // first fee
        Option::Some(wbtc_address),  // Use WBTC as intermediate
        Option::Some(3000)           // second fee
    );
}