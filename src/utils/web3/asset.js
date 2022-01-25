import {
  getContract,
  contractAddress
} from "./contract";
import store from '@/store'
import {
  createWatcher,
  aggregate
} from '@makerdao/multicall'
import { sleep } from '@/utils/helper'
import { getAllCommunities, getMyCommunityContract, getNonce } from '@/utils/web3/community'
import { getAccounts } from '@/utils/web3/account'
import {
  ethers
} from "ethers";
import {
  waitForTx,
  getProvider
} from './ethers'
import {
  getAllTokens,
  updateTokenIcon as uti
} from '@/apis/api'
import { 
  errCode,
  Multi_Config
} from "@/config";

/**
 * Get community ctoken info
 * @param {*} update 
 * @returns 
 */
export const getCToken = async (communityId, update=false) => {
  return new Promise(async (resolve, reject) => {
    communityId = communityId.toLowerCase()
    let cTokens = store.state.web3.cTokens
    if (!update && cTokens[communityId]){
      resolve(cTokens[communityId])
      return;
    }
    let contract;
    try{
      contract = await getContract('Community', communityId)
    }catch(e){
      reject(e)
      return
    }

    try{
      const [tokenAddress, isMintable] = await Promise.all([contract.communityToken(), contract.isMintableCommunityToken()])
      try{
        const cToken = await getERC20Info(tokenAddress);
        cToken['isMintable'] = isMintable;
        cTokens[communityId] = cToken;
        store.commit('web3/saveCTokens', cTokens)
        resolve(cToken)
      }catch(e){
        reject(e);
        return
      }
    }catch(e){
      console.log(8889, e);
      reject(errCode.BLOCK_CHAIN_ERR)
      return;
    }
  })
}

// get ERC20 info from home chain.
export const getERC20Info = async (address) => {
  return new Promise(async (resolve, reject) => {
    let contract;
    try{
      contract = await getContract('ERC20', address);
    }catch (e) {
      console.log(666);
      reject(e);
      return;
    }
    try{
      const tokens = await getAllTokenFromBackend()
      let infos = await aggregate([{
        target: address,
        call: ['name()(string)'],
        returns: [
          ['name']
        ]
      },{
        target: address,
        call: ['symbol()(string)'],
        returns: [
          ['symbol']
        ]
      },{
        target: address,
        call:[
          'decimals()(uint8)'
        ],
        returns: [
          ['decimals']
        ]
      },{
        target: address,
        call: [
          'totalSupply()(uint256)'
        ],
        returns: [
          ['totalSupply']  
        ]
      }], Multi_Config)
      const tokenFromBackend = tokens?.filter(token => token.address.toLowerCase() === address.toLowerCase())
      let icon = null
      let price = null
      if (tokenFromBackend && tokenFromBackend.length > 0) {
        icon = tokenFromBackend[0].icon
        price = tokenFromBackend[0].price
      }
      resolve({
        name: infos?.results?.transformed?.name,
        symbol: infos?.results?.transformed?.symbol,
        decimal: infos?.results?.transformed?.decimals,
        totalSupply: infos?.results?.transformed?.totalSupply,
        price,
        address,
        icon
      })
    }catch(e){
      console.log('Wrong ERC20 address', e);
      reject(e)
    }
  })
}

/**
 * Depoly ERC20 token
 * @param {*} param0 token object
 * @param {Bool} isMintalbel  
 * @returns
 */
export const deployERC20 = async ({
  name,
  symbol,
  decimal,
  totalSupply
}, isMintable, callback) => {
  return new Promise(async (resolve, reject) => {
    try {
      debugger
      const contract = await getContract('ERC20Factory', null, false)
      let tokenDeploying = store.state.web3.tokenDeploying
      if (tokenDeploying){
        reject(errCode.TOKEN_DEPLOYING)
        return;
      }
      contract.on('ERC20TokenCreated', (_creator, _name, _symbol, _tokenAddress, _isMintable) => {
        if (store.state.web3.account.toLowerCase() === _creator.toLowerCase() && name === _name && symbol === _symbol && isMintable === _isMintable){
          contract.removeAllListeners('ERC20TokenCreated')
          store.commit('web3/saveTokenDeploying', false)
          resolve(_tokenAddress)
          return;
        }
      })
      tokenDeploying = true
      store.commit('web3/saveTokenDeploying', tokenDeploying)
      const tx = await contract.createERC20(name, symbol, ethers.utils.parseUnits(totalSupply, decimal), 
            store.state.web3.account, 
            isMintable);
      callback()
    } catch (e) {
      store.commit('web3/saveTokenDeploying', false)
      if (e.code === 4001) {
        reject(errCode.USER_CANCEL_SIGNING)
      }else{
        reject(errCode.BLOCK_CHAIN_ERR)
      }
      console.log(`Deploy mintable token ${name} failed`, e);
    }
  })
}

/**
 * Update token icon {address, icon}
 * @param {*} token 
 * @returns 
 */
export const updateTokenIcon = async (token) => {
  return new Promise(async (resolve, reject) => {
    try {
      const res = await uti(token)
      resolve(res)
    } catch (e) {
      reject(e)
    }
  })
}

/**
 * Get all tokens from nutbox backend
 * Will store data to cache
 * @param {*} update  wheather update local cache
 * @returns 
 */
export const getAllTokenFromBackend = async (update = false) => {
  return new Promise(async (resolve, reject) => {
    const tokens = store.state.web3.allTokens
    if (!update && tokens) {
      resolve(tokens)
    }
    try {
      const allTokens = await getAllTokens()
      store.commit('web3/saveAllTokens', allTokens)
      resolve(allTokens)
    } catch (e) {
      reject(500)
    }
  })
}

/**update tokens info from db */
export const updateAllTokensFromBackend = async () => {
  while(true){
    await getAllTokenFromBackend(true)
    await sleep(10)
  }
}

/**
 * monitor all ctoken balance of user
 * used in wallet
 */
export const getCtokenBalance = async () => {
  return new Promise(async (resolve, reject) => {
    try {
      const allCommunities = await getAllCommunities()
      const account = await getAccounts();
      const result = await aggregate(Object.values(allCommunities).map(c => ({
        target: c.ctoken,
        call:[
          'balanceOf(address)(uint256)',
          account
        ],
        returns:[
          [c.ctoken, val => val.toString() / 1e18]
        ]
      })), Multi_Config)
      resolve(result.results.transformed)
    }catch (e) {
      console.log('get ctoken balance fail', e);
      reject(e);
    }
  })
}

/**
 * get home chain balance
 * @returns 
 */
export const getBalance = async () => {
  const provider = await getProvider()
  const account = await getAccounts()
  return await provider.getBalance(account);
}

/**
 * get specil erc20 of user
 * @param {*} erc20 
 * @returns 
 */
export const getERC20Balance = async (erc20) => {
  return new Promise(async (resolve) => {
    try{
      const erc20Contract = await getContract('ERC20', erc20);
      const account = await getAccounts();
      if (!account) return 0
      const balanceBI = await erc20Contract.balanceOf(account);
      resolve(balanceBI);
    }catch(e) {
      resolve(-1);
    }
  })
}