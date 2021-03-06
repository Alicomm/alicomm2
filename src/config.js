/** =================================== Normal =======================================*/
// 调试模式
export const DEBUG = false;

export const LOCALE_KEY = "localeLanguage";
// nutbox backend server
export const BACKEND_API_URL = "https://api-walnut.nutbox.app"
// export const BACKEND_API_URL = "https://v2-api-test.nutbox.io";
// export const BACKEND_API_URL = "http://localhost:3000";

export const QN_UPLOAD_URL = BACKEND_API_URL + "/qiNiu/upload";

/**
 * ERROR CODE DEFINE
 */
export const errCode = {
  NO_STAKING_FACTORY: 101,
  ASSET_ID_ERROR: 102,
  WRONG_ETH_ADDRESS: 103,
  NOT_A_TOKEN_CONTRACT: 104,
  TRANSACTION_FAIL: 105,
  ASSET_EXIST: 106,
  TOKEN_DEPLOYING: 107,
  INSUFIENT_BALANCE: 108,

  BLOCK_CHAIN_ERR: 351,
  CONTRACT_CREATE_FAIL: 352,
  USER_CANCEL_SIGNING: 353,
  NOT_CONNECT_METAMASK: 354,
  UNLOCK_METAMASK: 355,
  WRONG_CHAIN_ID: 356,
  HAVE_CREATED_COMMUNITY: 357,

  SIGNATURE_FAILED: 451,
  INVALID_NONCE: 452,
  DB_ERROR: 453,
  SERVER_ERR: 500,
};

/**======================================= steem  ====================================*/

// steem node storage
export const STEEM_CONF_KEY = "steemNodeKey";
// delegate fee
export const STEEM_STAKE_FEE = 3;
// official fee account
export const STEEM_GAS_ACCOUNT = "walnut.gas";

// Steem Config
export const STEEM_API_URLS = [
  process.env.STEEM_API_URL || "https://api.steemitdev.com",
  "https://api.steemit.com",
  "https://cn.steems.top",
  "https://api.justyy.com",
  "https://aksaiapi.wherein.mobi",
];

/**===================================== hive  =======================================*/
// hive node storage
export const HIVE_CONF_KEY = "hiveNodeKey";
// delegate fee
export const HIVE_STAKE_FEE = 1;
// official fee account
export const HIVE_GAS_ACCOUNT = "walnut.gas";

// Hive Config
export const HIVE_API_URLS = ["https://api.hive.blog"];

/** ==================================Main chain============================================*/

//  moonbase alpha
// export const RPC_NODE = 'https://rpc.api.moonbase.moonbeam.network';
// export const BSC_CHAIN_ID = 1287;
// export const BLOCK_CHAIN_BROWER = 'https://moonbase.moonscan.io/';
// export const CHAIN_NAME = 'Moonbase-alpha';
// export const BSC_CHAIN_NAME = CHAIN_NAME;
// export const NATIVE_CURRENCY = {
//   name: 'DEV',
//   symbol: 'DEV',
//   decimals: 18
// }

// chapel
// export const RPC_NODE = 'https://data-seed-prebsc-1-s1.binance.org:8545';
// export const BSC_CHAIN_ID = 97;
// export const BLOCK_CHAIN_BROWER = 'https://testnet.bscscan.com//';
// export const CHAIN_NAME = 'BSC-Test';
// export const BSC_CHAIN_NAME = CHAIN_NAME;
// export const NATIVE_CURRENCY = {
//   name: 'BNB',
//   symbol: 'BNB',
//   decimals: 18
// }

// goerli
// export const RPC_NODE = 'https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161';
// export const BSC_CHAIN_ID = 5;
// export const BLOCK_CHAIN_BROWER = 'https://goerli.etherscan.io/';
// export const CHAIN_NAME = 'Goerli';
// export const BSC_CHAIN_NAME = CHAIN_NAME;
// export const NATIVE_CURRENCY = {
//   name: 'ETH',
//   symbol: 'ETH',
//   decimals: 18
// }

// bsc
export const RPC_NODE = 'https://bsc-dataseed.binance.org';
// export const RPC_NODE = 'https://still-red-snowflake.bsc.quiknode.pro/da03ce3f2590abcd5e1dbde82f87db93065c0237/';
export const BSC_CHAIN_ID = 56;
export const BLOCK_CHAIN_BROWER = 'https://bscscan.com/';
export const CHAIN_NAME = 'BSC-Mainnet';
export const BSC_CHAIN_NAME = CHAIN_NAME;
export const NATIVE_CURRENCY = {
  name: 'BNB',
  symbol: 'BNB',
  decimals: 18
}

export const BSC_STRATEGIES_NAME = process.env.VUE_APP_BSC_STRATEGIES_NAME;
export const BSC_STRATEGIES_PARAMS = process.env.VUE_APP_BSC_STRATEGIES_PARAMS;
export const MAIN_COMMUNITY_ID = process.env.VUE_APP_MAIN_COMMUNITY_ID;


export const FEE_TYPES = [
  'COMMUNITY',
  'USER'
]
/**
 * chainId on blockchain to chain name
 */
export const DELEGATION_CHAINID_TO_NAME = {
  1: "steem",
  2: "hive",
};

export const GasTimes = 1.5;


// local network
// export const MultiAddress = '0x6cA267098BEcC68Eb6094967f3Fb4bfaAF9ba979'      // on imac
// export const NutAddress = '0x8F45066eE7B4a09355A43bC689188a46b33797eB'

// export const MultiAddress = '0x0a73FCef08419d68E3f646151B5cFE0D3D4415fB'    // on local mac book
// export const NutAddress = '0x4E42eB91E2A27817cDB8C8094eB495a1322BbA01'      // onlocal mac book

// goerli network
// export const MultiAddress = "0x0de95fe541D4017A1a64AAe448BA80F07f96A937";
// export const NutAddress = "0xc821eC39fd35E6c8414A6C7B32674D51aD0c2468";

// bsc test
// export const MultiAddress = "0xae11C5B5f29A6a25e955F0CB8ddCc416f522AF5C";
// export const NutAddress = "0x871AD5aAA75C297EB22A6349871ce4588E3c0306";

// moonbase alpha
// export const MultiAddress = '0xBf27B3a22A76cA18E6dbb0F10190af78346da732'
// export const NutAddress = '0x871AD5aAA75C297EB22A6349871ce4588E3c0306'

// bsc net
export const MultiAddress = "0x41263cba59eb80dc200f3e2544eda4ed6a90e76c"
export const NutAddress = "0x4429FcdD4eC4EA4756B493e9c0525cBe747c2745"

// Register by nutbox
export const OfficialAssets = [
  {
    name: "Nutbox",
    address: NutAddress,
    symbol: "NUT",
    icon: "https://cdn.wherein.mobi/nutbox/v2/1633769085901",
  },
  {
    name: 'Wrapped BNB',
    address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
    symbol: 'WBNB',
    icon: 'https://cdn.wherein.mobi/nutbox/v2/bnb.png'
  },
  {
    name: 'Ethereum Token',
    address: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',
    symbol: 'ETH',
    icon: 'https://cdn.wherein.mobi/nutbox/v2/eth.png'
  },
  {
    name: 'PancakeSwap Token',
    address: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82',
    symbol: 'CAKE',
    icon: 'https://cdn.wherein.mobi/nutbox/v2/cake.png'
  },
  {
    name: 'BTCB Token',
    address: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c',
    symbol: 'BTCB',
    icon: 'https://cdn.wherein.mobi/nutbox/v2/btc.png'
  }
  // {
  //   name: 'Mint Club',
  //   address: '0x1f3Af095CDa17d63cad238358837321e95FC5915',
  //   symbol: 'MINT',
  //   icon: 'https://cdn.wherein.mobi/nutbox/v2/mint-logo.png'
  // },
  // {
  //   name: 'Mint Club Grant',
  //   address: '0x58764cE77f0140F9678bA6dED9D9697c979F4E0f',
  //   symbol: 'GRANT',
  //   icon: 'https://cdn.wherein.mobi/nutbox/v2/mint-grant.png'
  // },
  // {
  //   name: 'Mint Club DAO',
  //   address: '0x558810B46101DE82b579DD1950E9C717dCc28338',
  //   symbol: 'MINTDAO',
  //   contract: contractAddress['HomeChainAssetRegistry'],
  //   decimal: 18,
  //   type: 'HomeChainAssetRegistry',
  //   asset: '0x57fb04387de5155f968d37e9574b0ffb2dc47865f17fa71d31cc1296e8fd24e2',
  //   icon: 'https://cdn.wherein.mobi/nutbox/v2/mint-dao.png'
  // },
  // {
  //   name: 'Mint Club Creator',
  //   address: '0x9f3C60dC06f66b3e0ea1Eb05866F9c1A74d43D67',
  //   symbol: 'CREATOR',
  //   contract: contractAddress['HomeChainAssetRegistry'],
  //   decimal: 18,
  //   type: 'HomeChainAssetRegistry',
  //   asset: '0xc10a83b0bf2cd12664afd0a3a884a571e5df17b12b41a9d2c9f3bf1ad5fe47a5',
  //   icon: 'https://cdn.wherein.mobi/nutbox/v2/mint-creator.png'
  // }
];

export const Multi_Config = {
  rpcUrl: RPC_NODE,
  multicallAddress: MultiAddress,
  interval: 3000,
};
