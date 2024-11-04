import { reactive, readonly } from 'vue';

// Define the state
const state = reactive({
  localUrl: 'http://localhost:3001',
  url: 'http://localhost:1337'
});

// Define mutations for updating the state
const mutations = {
  setLocalUrl(newUrl) {
    state.localUrl = newUrl;
  },
  setLiveUrl(newUrl) {
    state.liveUrl = newUrl;
  }
};

// Define actions if you need to perform async operations before mutating the state
const actions = {
  updateLocalUrl(newUrl) {
    // You could perform async operations here if needed
    mutations.setLocalUrl(newUrl);
  },
  updateLiveUrl(newUrl) {
    // You could perform async operations here if needed
    mutations.setLiveUrl(newUrl);
  }
};

// Create a store object and export its public interface
export const urlStore = {
  state: readonly(state), // Readonly to prevent external mutations
  mutations,
  actions
};
