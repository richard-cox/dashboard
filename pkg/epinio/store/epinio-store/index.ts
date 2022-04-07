import { CoreStoreSpecifics, CoreStoreConfig } from '@shell/core/types';

import getters from './getters';
import mutations from './mutations';
import actions from './actions';

import { actions as subscribeActions } from './subscribe-shims';

import { EPINIO_PRODUCT_NAME } from '../../types';

const epinioFactory = (): CoreStoreSpecifics => {
  return {
    state() {
      return { };
    },

    getters: { ...getters },

    mutations: { ...mutations },

    actions:   {
      ...actions,
      ...subscribeActions
    },
  };
};
const config: CoreStoreConfig = { namespace: EPINIO_PRODUCT_NAME };

export default {
  specifics: epinioFactory(),
  config
};
