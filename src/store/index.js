import Vue from 'vue'
import Vuex from 'vuex'
import Cookie from 'vue-cookies'
import {
  LOCALE_KEY
} from '../config'

import polkadot from './polkadot'
import kusama from './kusama'
import rococo from './rococo'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    lang: Cookie.get(LOCALE_KEY) || 'zh-CN',
  },
  mutations: {
    saveLang: (state, lang) => {
      state.lang = lang;
      Cookie.set(LOCALE_KEY, lang, '30d')
    },
  },
  getters: {
  },
  modules: {
    polkadot,
    kusama,
    rococo
  }
})
