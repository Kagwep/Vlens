use starknet::ContractAddress;


#[starknet::interface]
pub trait IERC20<TContractState> {

    fn transfer(ref self: TContractState, recipient: ContractAddress, amount: u256) -> bool;


    fn balanceOf(self: @TContractState, account: ContractAddress) -> u256;


    fn approve(ref self: TContractState, spender: ContractAddress, amount: u256) -> bool;
}
