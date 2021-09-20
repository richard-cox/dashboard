import coreStore, { coreStoreModule, coreStoreState } from '@/plugins/core-store/index';
import {
  mutations as subscribeMutations,
  actions as subscribeActions,
  getters as subscribeGetters
} from './subscribe';

import getters from './getters';
import mutations from './mutations';
import actions from './actions';

function SteveFactory(namespace, baseUrl) {
  return {
    ...coreStoreModule,

    state() {
      return {
        ...coreStoreState(namespace, baseUrl),
        socket:       null,
        queue:        [],
        wantSocket:   false,
        debugSocket:  false,
        pendingSends: [],
        started:      [],
        inError:      {},
      };
    },

    getters: {
      ...coreStoreModule.getters,
      ...getters,
      ...subscribeGetters
    },

    mutations: {
      ...coreStoreModule.mutations,
      ...mutations,
      ...subscribeMutations,
    },
    actions: {
      ...coreStoreModule.actions,
      ...actions,
      ...subscribeActions
    },
  };
}

export default (config) => {
  // { namespace: 'management', baseUrl: '/v1' }
  return coreStore(
    SteveFactory(config),
    config.namespace,
    config.baseUrl,
  );
};
