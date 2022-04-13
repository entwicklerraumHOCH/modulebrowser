import { Module } from '@/modules'
import { createStore } from 'vuex'

export default createStore<AppStore>({
  state: () => ({
    modules: [],
  }),
  getters: {
  },
  mutations: {
    clearModules(state) {
      state.modules = []
    },
    addModules(state, mods: (Module & { id: string })[]) {
        state.modules = mods
        state.modules.sort((a,b)=>a.id.localeCompare(b.id))
    }
  },
  actions: {
    async refreshModules({ commit }) {
      commit('clearModules')
      let mods = await fetch("http://localhost:9999/modules")
        .then((x) => x.json())
      commit('addModules', mods)
    }
  },
  modules: {
  }
})

export interface AppStore {
  modules: (Module & { id: string })[]
}