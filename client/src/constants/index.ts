import { RpcProvider, constants } from "starknet"
import ChainChaitABI from "../abi/ChainChatContract.json"
import AvnuChaitABI from "../abi/Avnu.json"
import tokensAllJson from "../assets/tokens.json";
import singletonABI from "../abi/singleton.json";
import extensionClAbi from "../abi/extensionCL.json";
import  oracleAbi from "../abi/pragma_oracle.json"
import constaBI from "../assets/extepo.json"
import Erc20Abi from "../abi/ERC20.json"
import lendABI from "../abi/lendAbi.json"

export const tokensAll = tokensAllJson;

export const ChainChatContractAddress = '0x0085abb4f8c75bbfe959431628f6700b13c457d8c0caaaa0ec81d92f7810400c';
export const AvnuContractAddress = '0x04270219d365d6b017231b52e92b3fb5d7c8378b05e9abc97724537a80e93b0f'

export const  ChainChatAbi = ChainChaitABI;
export const  AvnuChatAbi = AvnuChaitABI;

export const SINGLETON_ABI = singletonABI;

export const ETHTokenAddress =
  "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7"

export const DAITokenAddress =
  "0x00da114221cb83fa859dbdb4c44beeaa0bb37c7537ad5ae66fe5e0efd20e6eb3"

export const ARGENT_DUMMY_CONTRACT_MAINNET_ADDRESS =
  "0x001c515f991f706039696a54f6f33730e9b0e8cc5d04187b13c2c714401acfd4"

export const ARGENT_DUMMY_CONTRACT_SEPOLIA_ADDRESS =
  "0x88d3cc4377a6cdfd27545a11548bd070c4e2e1e3df3d402922dbc4350b416"

export const CHAIN_ID =
  import.meta.env.VITE_PUBLIC_CHAIN_ID === constants.NetworkName.SN_MAIN
    ? constants.NetworkName.SN_MAIN
    : constants.NetworkName.SN_SEPOLIA

const NODE_URL =
  import.meta.env.VITE_PUBLIC_CHAIN_ID === constants.NetworkName.SN_MAIN
    ? "https://starknet-mainnet.public.blastapi.io"
    : "https://starknet-sepolia.public.blastapi.io/rpc/v0_7"

export const STARKNET_CHAIN_ID =
  import.meta.env.VITE_PUBLIC_CHAIN_ID === constants.NetworkName.SN_MAIN
    ? constants.StarknetChainId.SN_MAIN
    : constants.StarknetChainId.SN_SEPOLIA

export const provider = new RpcProvider({
  nodeUrl: NODE_URL,
  chainId: STARKNET_CHAIN_ID,
})

export const ARGENT_SESSION_SERVICE_BASE_URL =
  import.meta.env.VITE_PUBLIC_ARGENT_SESSION_SERVICE_BASE_URL ||
  "https://cloud.argent-api.com/v1"

export const ARGENT_WEBWALLET_URL =
  import.meta.env.VITE_PUBLIC_ARGENT_WEBWALLET_URL ||
  "https://sepolia-web.argent.xyz"
  console.log(STARKNET_CHAIN_ID,import.meta.env.VITE_PUBLIC_CHAIN_ID === constants.NetworkName.SN_MAIN,ARGENT_WEBWALLET_URL)

export const USE_SEPOLIA_DUMMY_CONTRACT = import.meta.env.VITE_PUBLIC_USE_SEPOLIA_DUMMY_CONTRACT
  ? import.meta.env.VITE_PUBLIC_USE_SEPOLIA_DUMMY_CONTRACT === "true"
  : false

export const ARGENT_DUMMY_CONTRACT_ADDRESS =
  CHAIN_ID === constants.NetworkName.SN_SEPOLIA
    ? ARGENT_DUMMY_CONTRACT_SEPOLIA_ADDRESS
    : ARGENT_DUMMY_CONTRACT_MAINNET_ADDRESS


    // Sepolia contract addresses and configuration
export const CONTRACTS = {
  singleton: "0x69d0eca40cb01eda7f3d76281ef524cecf8c35f4ca5acc862ff128e7432964b",
  extension: "0x18e0277fef34ae5687da68b7810a04230a45ff9686068868528d2e07fae705d", // extensionPO
  pragma_oracle: "0x4d50f735be96c4ad60b4f6e4ae92ae4b65e84d89497860116dd8bcee3d39c13"
};

// Sepolia assets
export const ASSETS = {
  ETH: "0x7809bb63f557736e49ff0ae4a64bd8aa6ea60e3f77f26c520cb92c24e3700d3",
  WBTC: "0x63d32a3fa6074e72e7a1e06fe78c46a0c8473217773e19f11d8c8cbfc4ff8ca",
  USDC: "0x27ef4670397069d7d5442cb7945b27338692de0d8896bdb15e6400cf5249f94",
  USDT: "0x2cd937c3dccd4a4e125011bbe3189a6db0419bb6dd95c4b5ce5f6d834d8996",
  wstETH: "0x57181b39020af1416747a7d0d2de6ad5a5b721183136585e8774e1425efd5d2",
  STRK: "0x772131070c7d56f78f3e46b27b70271d8ca81c7c52e3f62aa868fab4b679e43"
};

// Sepolia pool ID
export const POOL_ID = "843471078868109043994407045333485539726819752573207893362353166067597145284";


export const EXTENSION_ABI = extensionClAbi;


export const ORACLE_ABI = oracleAbi;

export const EXTPABI = constaBI;

export const ECONTRACTADDRESS = "0x07cf3881eb4a58e76b41a792fa151510e7057037d80eda334682bd3e73389ec0"

export const ERC20ABI = Erc20Abi;



export const LENDABI = lendABI;

export const LEND_CONTRACT_ADRRESS = "0x073bd1576aade4cba29879ab2f832a3da4775a58246b4d792a293f35083bdf4a";