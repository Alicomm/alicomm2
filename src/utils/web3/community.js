import { getContract, contractAddress } from "./contract";
import { ethers } from "ethers";
import store from "@/store";
import {
  getNonce as gn,
  getMyCommunityInfo as gci,
  insertCommunity,
  updateCommunity,
  getAllCommunities as gac,
  updateBlogTag as ubt,
  updateSocial,
  getCommunityToken as gct,
  getStakingFeast
} from "@/apis/api";
import { signMessage } from "./utils";
import { errCode, Multi_Config, GasTimes } from "@/config";
import { waitForTx, getGasPrice } from "./ethers";
import { sleep } from "@/utils/helper";
import { createWatcher, aggregate } from "@makerdao/multicall";
import { getCToken } from "./asset";
import BN from "bn.js";
import { getAccounts } from "@/utils/web3/account";

/**
 * Get community admin's staking factory id
 * @returns
 */
export const getMyStakingFactory = async (update = false) => {
  return new Promise(async (resolve, reject) => {
    const id = store.state.web3.stakingFactoryId;
    if (!update && id) {
      resolve(id);
      return;
    }
    store.commit("web3/saveLoadingCommunity", true);
    

    const account = await getAccounts();
    let stakingFactoryId = null;
    try {
      stakingFactoryId = await getStakingFeast(account);
      if (!stakingFactoryId || stakingFactoryId.length === 0) {
        store.commit("web3/saveStakingFactoryId", null);
        store.commit("web3/saveLoadingCommunity", false);
        resolve(null);
        return;
      }
    } catch (e) {
      console.log("Get staking feast record fail", e);
      reject(errCode.BLOCK_CHAIN_ERR);
      return;
    }
    console.log("community", stakingFactoryId);
    stakingFactoryId = stakingFactoryId[0].stakingFeast;
    store.commit("web3/saveLoadingCommunity", false);
    store.commit("web3/saveStakingFactoryId", stakingFactoryId);
    resolve(stakingFactoryId);
  });
};

/**
 * Get community's infos from backend
 * @param {*} update
 * @returns
 */
export const getMyCommunityInfo = async (update = false) => {
  return new Promise(async (resolve, reject) => {
    let stakingFactoryId = null;
    try {
      stakingFactoryId = await getMyStakingFactory(update);
      if (!stakingFactoryId) {
        reject(errCode.NO_STAKING_FACTORY);
        return;
      }
    } catch (e) {
      console.log("Get my staking factory fail", e);
      reject(e);
      return;
    }
    if (!update && store.state.web3.communityInfo) {
      resolve(store.state.web3.communityInfo);
      return;
    }
    let communityInfo = null;
    try {
      communityInfo = await gci(stakingFactoryId);

      if (communityInfo && communityInfo.length > 0) {
        store.commit("web3/saveCommunityInfo", communityInfo[0]);
        resolve(communityInfo[0]);
        return;
      } else {
        console.log("first get communityInfo");
        store.commit("web3/saveCommunityInfo", { id: stakingFactoryId });
        resolve({ id: stakingFactoryId });
      }
    } catch (e) {
      console.log("Get community info from backend fail", e);
      store.commit("web3/saveCommunityInfo", null);
      reject(e);
    }
  });
};

/**
 * get all community infos
 */
export const getAllCommunities = async (update = false) => {
  return new Promise(async (resolve, reject) => {
    if (
      !update &&
      store.state.web3.allCommunities &&
      store.state.web3.allCommunities.length > 0
    ) {
      resolve(store.state.web3.allCommunities);
      return;
    }
    try {
      if(store.state.web3.loadingAllCommunities){
        while(store.state.web3.loadingAllCommunities) {
          await sleep(0.2)
        }
        resolve(store.state.web3.allCommunities)
        return;
      }
      console.log(22222222222);
      store.commit('web3/saveLoadingAllCommunities', true);
      const currentCommunityId = store.state.currentCommunityId;
      const communities = await gac(currentCommunityId);
      store.commit("web3/saveAllCommunities", communities);
      store.commit('web3/saveLoadingAllCommunities', false);
      resolve(communities);
    } catch (e) {
      console.log("Get all community fail", e);
      store.commit('web3/saveLoadingAllCommunities', false);
      reject(e);
    }
  });
};

/**update tokens info from db */
export const updateAllCommunitiesFromBackend = async () => {
  while (true) {
    await sleep(18);
    await getAllCommunities(true);
  }
};

/**
 * Create Community Staking Factory Contracts
 * @param {*} form contract params
 */
export const createStakingFeast = async (form) => {
  return new Promise(async (resolve, reject) => {
    try {
      const comId = await getMyStakingFactory();
      if (comId) {
        console.log("Can only register one community for an account");
        reject(errCode.CONTRACT_CREATE_FAIL);
        return;
      }
    } catch (e) {
      reject(e);
      return;
    }

    let contract;
    try {
      contract = await getContract("StakingFactory", null, false);
    } catch (e) {
      reject(e);
      return;
    }

    try {
      // make params
      const gas = await getGasPrice();
      const account = await getAccounts();
      const assetId = form.assetId;
      let distribution = form.poolData;
      let distributionStr =
        "0x" +
        ethers.utils
          .hexZeroPad(ethers.utils.hexlify(distribution.length), 1)
          .substr(2);
      for (let dis of distribution) {
        distributionStr +=
          ethers.utils
            .hexZeroPad(
              ethers.BigNumber.from(dis.startHeight).toHexString(),
              32
            )
            .substr(2) +
          ethers.utils
            .hexZeroPad(ethers.BigNumber.from(dis.stopHeight).toHexString(), 32)
            .substr(2) +
          ethers.utils
            .hexZeroPad(
              ethers.utils
                .parseUnits(dis.amount.toString(), form.decimal)
                .toHexString(),
              32
            )
            .substr(2);
      }
      contract.on('StakingFeastCreated', async (user, feast, asset) => {
        if (account.toLowerCase() === user.toLowerCase() && asset.toLowerCase() == assetId.toLowerCase()){
          console.log('Create new staking feast', feast);
          store.commit("web3/saveStakingFactoryId", ethers.utils.getAddress(feast));
          await monitorCommunity();
          contract.removeAllListeners('StakingFeastCreated');
          resolve(feast);
        }
      })
      // call contract
      const res = await contract.createStakingFeast(
        assetId,
        contractAddress["LinearCalculator"],
        distributionStr);
      await waitForTx(res.hash);
    } catch (e) {
      console.log("Create Staking Feast Failed", e);
      reject(errCode.BLOCK_CHAIN_ERR);
      return;
    }
  });
};

/**
 * Create or update community info to backend
 * @param {*} form
 * @param {*} type 'create' / 'edit'
 */
export const completeCommunityInfo = async (form, type) => {
  return new Promise(async (resolve, reject) => {
    let nonce = await getNonce();
    const userId = await getAccounts();
    nonce = nonce ? nonce + 1 : 1;
    try {
      const distri = await getDistributionEras(true);
      form.firstBlock = distri[0].startHeight;
    } catch (e) {
      reject(e);
      return;
    }
    const originMessage = JSON.stringify(form);
    let signature = "";
    try {
      signature = await signMessage(originMessage + nonce);
    } catch (e) {
      if (e.code === 4001) {
        reject(errCode.USER_CANCEL_SIGNING);
        return;
      }
    }
    const params = {
      userId,
      infoStr: originMessage,
      nonce,
      signature,
    };
    try {
      let res = null;
      if (type === "edit") {
        res = await updateCommunity(params);
      } else {
        res = await insertCommunity(params);
      }
      // update nonce in storage
      store.commit("web3/saveNonce", nonce);
      resolve(res);
    } catch (e) {
      console.log("Insert community info failed", e);
      reject(e);
    }
  });
};

/**
 * Charge community's balance
 * Only non-mintable ctoken need to charge balance
 * @param {*} amount
 */
export const chargeCommunityBalance = async (amount) => {
  return new Promise(async (resolve, reject) => {
    let stakingFactoryId = null;
    let contract = null;
    try {
      stakingFactoryId = await getMyStakingFactory();
      if (!stakingFactoryId) {
        reject(errCode.NO_STAKING_FACTORY);
        return;
      }
      contract = await getContract("StakingTemplate", stakingFactoryId, false);
    } catch (e) {
      reject(e);
      return;
    }

    try {
      const tx = await contract.adminDepositReward(amount.toString());
      await waitForTx(tx.hash);
      resolve(tx.hash);
    } catch (e) {
      console.log("Charging community balance Failed", e);
      reject(errCode.BLOCK_CHAIN_ERR);
      return;
    }
  });
}

/**
 * withdraw community balance
 * @param {*} amount 
 * @returns 
 */
export const withdrawCommunityBalance = async (amount) =>  {
  return new Promise(async (resolve, reject) => {
    let stakingFactoryId = null;
    let contract = null;
    try {
      stakingFactoryId = await getMyStakingFactory();
      if (!stakingFactoryId) {
        reject(errCode.NO_STAKING_FACTORY);
        return;
      }
      contract = await getContract("StakingTemplate", stakingFactoryId, false);
    } catch (e) {
      reject(e);
      return;
    }

    try {
      const tx = await contract.adminWithdrawReward(amount.toString());
      await waitForTx(tx.hash);
      resolve(tx.hash);
    } catch (e) {
      console.log("Withdraw community balance Failed", e);
      reject(errCode.BLOCK_CHAIN_ERR);
      return;
    }
  });
}

/**
 * Approve erc20handler to user users ctoken
 * @param {*} address ctoken address
 */
export const approveCommunityBalance = async (address) => {
  return new Promise(async (resolve, reject) => {
    let contract;
    try {
      contract = await getContract("ERC20", address, false);
    } catch (e) {
      reject(e);
      return;
    }

    const erc20Handler = contractAddress["ERC20AssetHandler"];
    try {
      new BN(10).pow(new BN(18 + 50));
      const tx = await contract.approve(
        erc20Handler,
        new BN(10).pow(new BN(18 + 50)).toString()
      );
      await waitForTx(tx.hash);
      resolve(tx.hash);
    } catch (e) {
      if (e.code === 4001) {
        reject(errCode.USER_CANCEL_SIGNING);
      } else {
        reject(errCode.BLOCK_CHAIN_ERR);
      }
      console.log("Approve community banlance Fail", e);
    }
  });
};

/**
 * Update dev address
 * @param {*} address
 * @returns
 */
export const setDevAddress = async (address) => {
  return new Promise(async (resolve, reject) => {
    if (!ethers.utils.isAddress(address)) {
      reject(errCode.WRONG_ETH_ADDRESS);
      return;
    }
    let stakingFactoryId = null;
    let contract = null;
    try {
      stakingFactoryId = await getMyStakingFactory();
      if (!stakingFactoryId) {
        reject(errCode.NO_STAKING_FACTORY);
        return;
      }
      contract = await getContract("StakingTemplate", stakingFactoryId, false);
    } catch (e) {
      reject(e);
      return;
    }

    try {
      const tx = await contract.setDev(address);
      await waitForTx(tx.hash);
      resolve(tx.hash);
    } catch (e) {
      console.log("Set community address Failed", e);
      reject(errCode.BLOCK_CHAIN_ERR);
      return;
    }
  });
};

/**
 * Update dev ratio
 * @param {int} ratio 0-10000
 * @returns
 */
export const setDevRatio = async (ratio) => {
  return new Promise(async (resolve, reject) => {
    if (ratio < 0 || ratio > 10000) {
      reject(errCode.WRONG_INPUT_DEV_RATIO);
      return;
    }
    let stakingFactoryId = null;
    let contract = null;
    try {
      stakingFactoryId = await getMyStakingFactory();
      if (!stakingFactoryId) {
        reject(errCode.NO_STAKING_FACTORY);
        return;
      }
      contract = await getContract("StakingTemplate", stakingFactoryId, false);
    } catch (e) {
      reject(e);
      return;
    }

    try {
      const tx = await contract.setDevRewardRatio(ratio);
      await waitForTx(tx.hash);
      resolve(tx.hash);
    } catch (e) {
      console.log("Set community address Failed", e);
      reject(errCode.BLOCK_CHAIN_ERR);
      return;
    }
  });
};

/**
 * Get cToken distribuitons eras
 * @param {*} update
 */
export const getDistributionEras = async (update = false) => {
  return new Promise(async (resolve, reject) => {
    const distribuitons = store.state.web3.distributions;
    if (!update && distribuitons) {
      resolve(distribuitons);
      return;
    }

    let stakingFactoryId = null;
    try {
      stakingFactoryId = await getMyStakingFactory();
      if (!stakingFactoryId) {
        reject(errCode.NO_STAKING_FACTORY);
        return;
      }
    } catch (e) {
      reject(e);
      return;
    }

    let contract;
    let decimal;
    let rewardCalculator;
    try {
      contract = await getContract("StakingTemplate", stakingFactoryId);
      const cToken = await getCToken(stakingFactoryId);
      rewardCalculator = await getContract("LinearCalculator");
      decimal = cToken.decimal;
    } catch (e) {
      reject(e);
      return;
    }

    try {
      const rewardCalculatorAddress = await contract.rewardCalculator();
      if (rewardCalculatorAddress == contractAddress["LinearCalculator"]) {
        const count = await rewardCalculator.distributionCountMap(
          stakingFactoryId
        );
        let distri = await Promise.all(
          new Array(count)
            .toString()
            .split(",")
            .map((item, i) =>
              rewardCalculator.distributionErasMap(stakingFactoryId, i)
            )
        );
        distri = distri.map((item, i) => ({
          percentage: item.stopHeight - item.startHeight,
          amount: item.amount.toString() / 10 ** decimal,
          startHeight: item.startHeight.toString(),
          stopHeight: item.stopHeight.toString(),
          background: `rgba(80, 191, 0, ${(i + 1) * (1.0 / count)})`,
        }));
        store.commit("web3/saveDistributions", distri);
        resolve(distri);
      }
    } catch (e) {
      console.log("getDistributionEras", e);
      reject(e);
      return;
    }
  });
};

/**
 * get child community distribution eras
 * @param {*} communityId 
 */
export const getSpecifyDistributionEras = async (communityId) => {
  return new Promise(async (resolve, reject) => {
    const distribuitons = store.state.web3.specifyDistributionEras;
    if (distribuitons) {
      resolve(distribuitons);
      return;
    }
    let contract;
    let decimal;
    let rewardCalculator;
    try {
      contract = await getContract("StakingTemplate", communityId);
      const cToken = await getCToken(communityId);
      rewardCalculator = await getContract("LinearCalculator");
      decimal = cToken.decimal;
    } catch (e) {
      reject(e);
      return;
    }

    try {
      const rewardCalculatorAddress = await contract.rewardCalculator();
      if (rewardCalculatorAddress == contractAddress["LinearCalculator"]) {
        const count = await rewardCalculator.distributionCountMap(
          communityId
        );
        let distri = await Promise.all(
          new Array(count)
            .toString()
            .split(",")
            .map((item, i) =>
              rewardCalculator.distributionErasMap(communityId, i)
            )
        );
        distri = distri.map((item, i) => ({
          percentage: item.stopHeight - item.startHeight,
          amount: item.amount.toString() / 10 ** decimal,
          startHeight: item.startHeight.toString(),
          stopHeight: item.stopHeight.toString(),
          background: `rgba(80, 191, 0, ${(i + 1) * (1.0 / count)})`,
        }));
        store.commit("web3/saveSpecifyDistributionEras", distri);
        resolve(distri);
      }
    } catch (e) {
      console.log("getSpecifyDistributionEras", e);
      reject(e);
      return;
    }
  })
}

/**
 * Post community blog tag to backend
 * @param {*} blogTag
 * @returns
 */
export const publishBlog = async (blogTag) => {
  return new Promise(async (resolve, reject) => {
    let id;
    try {
      id = await getMyStakingFactory();
      if (!id) {
        reject(errCode.NO_STAKING_FACTORY);
        return;
      }
    } catch (e) {
      reject(e);
      return;
    }
    let nonce = await getNonce();
    const userId = await getAccounts();
    nonce = nonce ? nonce + 1 : 1;
    const infoStr = JSON.stringify({
      id,
      blogTag,
    });
    let signature = "";
    try {
      signature = await signMessage(infoStr + nonce);
    } catch (e) {
      if (e.code === 4001) {
        reject(errCode.USER_CANCEL_SIGNING);
        return;
      }
    }
    const params = {
      userId,
      infoStr,
      nonce,
      signature,
    };
    try {
      let res = await ubt(params);
      store.commit("web3/saveNonce", nonce);
      resolve(res);
    } catch (e) {
      console.log("Update community blogTag info failed", e);
      reject(e);
    }
  });
};

/**
 * update social info
 * @param {*} social
 */
export const udpateSocialInfo = async (social) => {
  return new Promise(async (resolve, reject) => {
    let id;
    try {
      id = await getMyStakingFactory();
      if (!id) {
        reject(errCode.NO_STAKING_FACTORY);
        return;
      }
    } catch (e) {
      reject(e);
      return;
    }
    let nonce = await getNonce();
    const userId = await getAccounts();
    nonce = nonce ? nonce + 1 : 1;
    const infoStr = JSON.stringify({
      id,
      ...social,
    });
    let signature = "";
    try {
      signature = await signMessage(infoStr + nonce);
    } catch (e) {
      if (e.code === 4001) {
        reject(errCode.USER_CANCEL_SIGNING);
        return;
      }
    }
    const params = {
      userId,
      infoStr,
      nonce,
      signature,
    };
    try {
      let res = await updateSocial(params);
      store.commit("web3/saveNonce", nonce);
      resolve(res);
    } catch (e) {
      console.log("Update community social info failed", e);
      reject(e);
    }
  });
};

/**
 * Get User's nonce
 * @param {*} update
 */
export const getNonce = async (update = false) => {
  let nonce = store.state.web3.nonce;
  const account = await getAccounts();
  if (!update && nonce) {
    return nonce;
  }
  nonce = await gn(account);
  store.commit("web3/saveNonce", nonce);
  return nonce;
};

/**
 * get community balance by ctoken
 * @param {*} ctoken 
 * @returns 
 */
export const getCommunityBalance = async (communityId, ctoken) => {
  return new Promise(async (resolve, reject) => {
    try{
      const assetId = ctoken.assetId;
      let contract;
      try{
        contract = await getContract("ERC20AssetHandler");
      }catch(e) {
        reject(e);
      }
      const source = ethers.utils.keccak256(
        "0x" +
        communityId.substr(2) +
        assetId.substr(2) +
          "61646d696e"
      )
      const balance = await contract.getBalance(source);
      resolve(balance);
    }catch(e) {
      reject(e)
    }
  })
}

/**
 * get specify community dao fund info
 * @param {*} communityId 
 */
export const getCommunityDaoInfo = async (communityId) => {
  return new Promise(async (resolve, reject) => {
    try {
      const contract = await getContract("StakingTemplate", communityId);
      const [dev, ratio] = await Promise.all([contract.getDev(), contract.getDevRewardRatio()]);
      resolve({ dev, ratio })
    }catch(e) {
      reject(e)
    }
  })
}

/**
 * monityor Community balance and allowance
 * If cToken of this community is not a mintable token, he may need to charge balance of community
 */
export const monitorCommunityBalance = async (communityInfo) => {
  return new Promise(async (resolve, reject) => {
    try {
      const cToken = await getCToken(communityInfo.id);
      if (cToken.isMintable) {
        resolve();
        return;
      }
      store.commit("web3/saveLoadingCommunityBalance", true);
      store.commit("web3/saveLoadingApprovementCtoken", true);
      let watchers = store.state.web3.watchers;
      let watcher = watchers["communityBalance"];
      const erc20HandlerAddress = contractAddress["ERC20AssetHandler"];
      watcher && watcher.stop();
      const account = await getAccounts();
      watcher = createWatcher(
        [
          {
            target: erc20HandlerAddress,
            call: [
              "getBalance(bytes32)(uint256)",
              ethers.utils.keccak256(
                "0x" +
                  communityInfo.id.substr(2) +
                  cToken.assetId.substr(2) +
                  "61646d696e"
              ),
            ],
            returns: [["communityBalance"]],
          },
          {
            target: cToken.address,
            call: [
              "allowance(address,address)(uint256)",
              account,
              erc20HandlerAddress,
            ],
            returns: [["allowance", (val) => val / 1e18 > 1e10]],
          },
        ],
        Multi_Config
      );
      watcher.subscribe((update) => {
        const type = update.type;
        const value = update.value;
        if (type === "communityBalance") {
          // console.log('Updates community balance', update);
          store.commit("web3/saveCommunityBalance", value);
        } else if (type === "allowance") {
          // console.log('Updates community approvement', update);
          store.commit("web3/saveCtokenApprovement", value);
        }
      });
      watcher.start();
      watchers["communityBalance"] = watcher;
      store.commit("web3/saveWatchers", { ...watchers });
      resolve();
    } catch (e) {
      reject(e);
    } finally {
      store.commit("web3/saveLoadingCommunityBalance", false);
      store.commit("web3/saveLoadingApprovementCtoken", false);
    }
  });
};

/**
 * Monitor community dev address and dev ratio
 * @param {*} communityInfo
 * @returns
 */
export const monitorCommunityDevInfo = async (communityInfo) => {
  return new Promise(async (resolve, reject) => {
    try {
      store.commit("web3/saveLoadingDevInfo", true);
      let watchers = store.state.web3.watchers;
      let watcher = watchers["devInfo"];
      watcher && watcher.stop();
      watcher = createWatcher(
        [
          {
            target: communityInfo.id,
            call: ["getDev()(address)"],
            returns: [["devAddress"]],
          },
          {
            target: communityInfo.id,
            call: ["getDevRewardRatio()(uint16)"],
            returns: [["devRatio"]],
          },
        ],
        Multi_Config
      );
      watcher.subscribe((update) => {
        const type = update.type;
        const value = update.value;
        if (type === "devAddress") {
          // console.log('update dev address', value);
          store.commit("web3/saveDevAddress", value);
        } else if (type === "devRatio") {
          // console.log('update dev ratio', value);
          store.commit("web3/saveDevRatio", value);
        }
      });
      watcher.start();
      watchers["devInfo"] = watcher;
      store.commit("web3/saveWatchers", { ...watchers });
      resolve();
    } catch (e) {
      reject(e);
    } finally {
      store.commit("web3/saveLoadingDevInfo", false);
    }
  });
};

export const monitorCommunity = async () => {
  let communityInfo;
  try {
    communityInfo = await getMyCommunityInfo();
    if (!communityInfo) {
      return;
    }
  } catch (e) {
    return;
  }
  await Promise.all([
    monitorCommunityBalance(communityInfo),
    monitorCommunityDevInfo(communityInfo),
  ]).catch(console.error);
};