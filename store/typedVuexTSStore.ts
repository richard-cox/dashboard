import { getterTree, mutationTree, actionTree } from 'nuxt-typed-vuex';

export const state = () => ({ count: 3 });

export const getters = getterTree(state, {
  evenMore:    state => state.count + 5,
  nameAndMore: (state, getters, rootState) => `${ rootState.vanillaStoreName }: ${ state.count }`,
});

export const mutations = mutationTree(state, { SET_COUNT: (state, newCount: number) => (state.count = newCount) });

export const actions = actionTree(
  {
    state, getters, mutations
  },
  {
    printRootState(state, rootState) {
      console.log('accessing rootState:', rootState.vanillaStoreName);
    },
  }
);
