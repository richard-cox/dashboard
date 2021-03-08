import { TIMED_OUT } from '@/config/query-params';
import { getAccessorType, getterTree, actionTree, mutationTree } from 'nuxt-typed-vuex';

import * as typedVuexTSStore from '@/store/typedVuexTSStore';
// import * as actionMenu from '@/store/action-menu';
// import * as auth from '@/store/auth';
// import * as aws from '@/store/aws';
// import * as catalog from '@/store/catalog';
// import * as github from '@/store/github';
// import * as growl from '@/store/growl';
// import * as i18n from '@/store/i18n';
// import * as prefs from '@/store/prefs';
// import * as typeMap from '@/store/type-map';
// import * as wm from '@/store/wm';
// import { state, getters, mutations, actions } from '@/store';

export default getAccessorType({
  // state,
  // getters,
  // mutations,
  // actions,
  modules: {
    typedVuexTSStore,
    // 'action-menu': actionMenu,
    // auth,
    // aws,
    // catalog,
    // github,
    // growl,
    // prefs,
    // 'type-map':    typeMap,
    // wm,
    // i18n
  }
});
