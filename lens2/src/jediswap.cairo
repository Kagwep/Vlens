use starknet::ContractAddress;

#[starknet::interface]
pub trait IJediSwapV2SwapRouter<TContractState> {
    fn exact_input(ref self: TContractState, params: ExactInputParams) -> u256;
}


#[derive(Drop, Serde)]
pub struct ExactInputParams {
    pub path: Array<felt252>, //[token1, token2, fee1, token2, token3, fee2]
    pub recipient: ContractAddress,
    pub deadline: u64,
    pub amount_in: u256,
    pub amount_out_minimum: u256
}
