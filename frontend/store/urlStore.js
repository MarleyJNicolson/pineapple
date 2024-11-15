import { reactive, readonly } from 'vue';


const state = reactive({
  localUrl: 'http://localhost:3001',
  url: 'http://localhost:1337'
});


const mutations = {
  setLocalUrl(newUrl) {
    state.localUrl = newUrl;
  },
  setLiveUrl(newUrl) {
    state.liveUrl = newUrl;
  }
};


const actions = {
  updateLocalUrl(newUrl) {
  
    mutations.setLocalUrl(newUrl);
  },
  updateLiveUrl(newUrl) {

    mutations.setLiveUrl(newUrl);
  }
};


export const urlStore = {
  state: readonly(state), 
  mutations,
  actions
};
