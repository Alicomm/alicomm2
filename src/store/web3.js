import Cookie from 'vue-cookies'
import { BSC_CHAIN_ID } from '@/config'

export default {
  namespaced: true,
  state: {
    ethers:null,
    account: Cookie.get('bsc-account'),
    allAccounts: [],
    abis: {},
    chainId: -1,
    stakingFactoryId: null,
    communityInfo: null,
    allAssetsOfUser: null,
    allTokens: null,
    blockNum: null,
    nonce: null,
    allCommunities: null,
    myPools: null,
    watcher: {},
    cTokens: {},
    distributions: null,
    readonlyProvider: null,
    allPools: null,
    // user deposit data
    depositDatas: {},
    // all pending reward got by multicall
    pendingRewards: {},
    userStakings:{},
    approvements: {},
    totalStakings: {},
    userBalances: {},

    // loading state
    loadingPendingRewards: true,
    loadingApprovements: true,
    loadingAllPools: true,
    loadingUserStakings: true,
    loadingUserBalances: true,

  },
  mutations: {
    saveEthers: (state, ethers) => {
      state.ethers = ethers
    },
    saveAccount: (state, account) => {
      state.account = account,
        Cookie.set('bsc-account', account, '30d')
    },
    saveAllAccounts: (state, allAccounts) => {
      state.allAccounts = allAccounts
    },
    saveAbi: (state, {name, abi}) => {
      state[name] = abi
    },
    saveChainId: (state, chainId) => {
      state.chainId = chainId
    },
    saveStakingFactoryId: (state, stakingFactoryId) => {
      state.stakingFactoryId = stakingFactoryId
    },
    saveCommunityInfo: (state, communityInfo) => {
      state.communityInfo = communityInfo
    },
    saveAllAssetsOfUser: (state, allAssetsOfUser) => {
      state.allAssetsOfUser = allAssetsOfUser
    },
    saveAllTokens: (state, allTokens) => {
      state.allTokens = allTokens
    },
    saveBlockNum : (state, blockNum) => {
      state.blockNum = blockNum
    },
    saveNonce: (state, nonce) => {
      state.nonce = nonce
    },
    saveAllCommunities: (state, communities) => {
      state.allCommunities = communities
    },
    saveMyPools: (state, myPools) => {
      state.myPools = myPools
    },
    saveWatcher: (state, watcher) => {
      state.watcher = watcher
    },
    saveCTokens: (state, cTokens) => {
      state.cTokens = cTokens
    },
    saveDistributions: (state, distributions) =>{
      state.distributions = distributions
    },
    saveReadonlyProvider: (state, readonlyProvider) => {
      state.readonlyProvider = readonlyProvider
    },
    saveAllPools: (state, allPools) => {
      state.allPools = allPools
    },
    saveDepositedDatas: (state, depositDatas) => {
      state.depositDatas = depositDatas
    },
    savePendingRewards: (state, pendingRewards) => {
      state.pendingRewards = pendingRewards
    },
    saveApprovements: (state, approvements) => {
      state.approvements = approvements
    },
    saveLoadingPendingRewards: (state, loadingPendingRewards) => {
      state.loadingPendingRewards = loadingPendingRewards
    },
    saveLoadingApprovements: (state, loadingApprovements) => {
      state.loadingApprovements = loadingApprovements
    },
    saveLoadingAllPools: (state, loadingAllPools) => {
      state.loadingAllPools = loadingAllPools
    },
    saveLoadingUserStakings: (state, loadingUserStakings) => {
      state.loadingUserStakings = loadingUserStakings
    },
    saveUserStakings: (state, userStakings) => {
      state.userStakings = userStakings
    },
    saveTotalStakings: (state, totalStakings) => {
      state.totalStakings = totalStakings
    },
    saveUserBalances: (state, userBalances) => {
      state.userBalances = userBalances
    },
    saveLoadingUserBalances: (state, loadingUserBalances) => {
      state.loadingUserBalances = loadingUserBalances
    }
  },
  getters: {
    isMainChain:(state) => {
      return parseInt(state.chainId) === parseInt(BSC_CHAIN_ID)
    },
    communityCard: (state) => {
      const allPools = state.allPools;
      const allCommunities = state.allCommunities
      if (!allPools || !allCommunities) return []
      console.log('allpools', allPools);
      const cardInfo = allCommunities.map(c => {
        const pools = allPools.filter(pool => pool.communityId === c.id)
        return {
          ...c,
          assetLogos: pools.map(p => p.icon),
          apys: pools.map(p => p.apy)
        }
      })
      return cardInfo
    },
    /**
     * Get community's info contains pools info
     * @param {*} state 
     * @returns 
     */
    communityById: (state) => (communityId) => {
      if (!state.allCommunities || !state.allPools) return {}
      let community = state.allCommunities.filter(c => c.id === communityId)
      const pools = state.allPools.filter(p => p.communityId === communityId)
      if (!community || community.length === 0){
        return {}
      }
      community = community[0]
      community.pools = pools
      return community
    },
  }
}
