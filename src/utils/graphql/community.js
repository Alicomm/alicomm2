import { client } from './index';
import store from '@/store'
import { gql } from 'graphql-request'
import { ListGroupPlugin } from 'bootstrap-vue';

// get user summary: include all joined communities and pools
export async function getNewCommunityOPHistory(community) {
    const query = gql`
        query getOperationHistory($id: String!) {
            userOperationHistories(where: {community: $id}, first: 100, orderBy: timestamp, orderDirection: desc){
                type
                community{
                    id
                }
                pool{
                    id
                }
                poolFactory
                chainId
                asset
                amount
                tx
                user
                timestamp
            }
        }
    `
    try{
        const userOperationHistories = await client.request(query, {id: community.toLowerCase()})
        if (userOperationHistories && userOperationHistories.userOperationHistories) {
            store.commit('community/saveCommunityHistory', {community, history:userOperationHistories.userOperationHistories})
        }
        return;
    }catch(err) {
        console.log('Get op history fail', err);
    }
}

export async function getUpdateCommunityOPHistory(community) {
    const query = gql`
        query getOperationHistory($id: String!, $timestamp: Int!) {
            userOperationHistories(where: {community: $id, timestamp_gt: $timestamp}, first: 20, orderBy: timestamp, orderDirection: desc){
                type
                community{
                    id
                }
                pool{
                    id
                }
                poolFactory
                chainId
                asset
                amount
                tx
                user
                timestamp
            }
        }
    `
    const existHistory = store.getters['community/getCommunityOPHistory'](community)
    if (!existHistory || existHistory.length === 0){
        await getNewCommunityOPHistory(community);
        return
    }
    const lastTime = existHistory[0].timestamp;
    try{
        let newOps = await client.request(query, { id: community.toLowerCase(), timestamp: parseInt(lastTime) });
        if (newOps && newOps.userOperationHistories && newOps.userOperationHistories.length > 0){
            store.commit('community/saveCommunityHistory', {community, history: newOps.concat(existHistory)});
        }else {
            console.log('no update');
        }
    }catch(err) {
        console.log('Get op history fail', err);
    }
}

export async function getMoreCommunityOPHistory(community) {
    const query = gql`
        query getOperationHistory($id: String!, $timestamp: Int!) {
            userOperationHistories(where: {community: $id, timestamp_lt: $timestamp}, first: 20, orderBy: timestamp, orderDirection: desc) {
                type
                community{
                    id
                }
                pool{
                    id
                }
                poolFactory
                chainId
                asset
                amount
                tx
                user
                timestamp
            }
        }
    `
    const oldHistory = store.getters['community/getCommunityOPHistory'](community)
    if (!oldHistory || oldHistory.length === 0){
        await getNewCommunityOPHistory(community);
        return
    }
    const lastTime = oldHistory[oldHistory.length - 1].timestamp;
    try{
        let newOps = await client.request(query, {id: community.toLowerCase(), timestamp: parseInt(lastTime)});
        if (newOps && newOps.userOperationHistories && newOps.userOperationHistories.length > 0){
            store.commit('community/saveCommunityHistory', {community, history: oldHistory.concat(newOps)});
        }else {
            console.log('no update');
        }
    }catch(err) {
        console.log('Get op history fail', err);
    }
}