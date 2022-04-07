import { CoreStoreSpecifics, CoreStoreConfig } from '@shell/core/types';

import { EPINIO_MGMT_STORE } from '../../types';

import getters from './getters';
import mutations from './mutations';
import actions from './actions';

const epinioMgmtFactory = (): CoreStoreSpecifics => {
  return {
    state() {
      return { managementReady: false };
    },

    getters: { ...getters },

    mutations: { ...mutations },

    actions: { ...actions },
  };
};
const config: CoreStoreConfig = { namespace: EPINIO_MGMT_STORE };

export default {
  specifics: epinioMgmtFactory(),
  config
};
