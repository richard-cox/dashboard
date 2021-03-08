// import { GetterTree, ActionTree, MutationTree } from 'vuex';

// import { RootState } from '~/store';

// export const state = () => ({ count: 3 });

// export type AnotherModuleState = ReturnType<typeof state>

// export const getters: GetterTree<AnotherModuleState, RootState> = {
//   evenMore:    state => state.count + 5,
//   nameAndMore: (state, getters, rootState) => `${ rootState.vanillaStoreName }: ${ state.count }`,
// };

// export const actions: ActionTree<AnotherModuleState, RootState> = {
//   printRootState({ rootState }) {
//     console.log('accessing rootState:', rootState.vanillaStoreName);
//   },
// };

// export const mutations: MutationTree<AnotherModuleState> = { SET_COUNT: (state, newCount: number) => (state.count = newCount) };
