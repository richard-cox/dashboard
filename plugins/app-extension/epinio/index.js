
import { init as productInit } from '@/plugins/app-extension/epinio/config/product/epinio';
import storeInit from '@/plugins/app-extension/epinio/store';

import { EPINIO_PRODUCT_NAME, EPINIO_TYPES } from '@/plugins/app-extension/epinio/types';

let applied = false;

export default {
  product: (store) => {
    if (applied) {
      return;
    }
    applied = true;
    productInit(store);

    // Sample App
    // [{"name":"sample","organization":"workspace","status":"Inactive, without workload. Launch via \"epinio app push\""}]
    // [{"active":true,"stage_id":"9814a9f9e6dc6922","name":"sample","organization":"workspace","status":"0/1","route":"sample.172.27.0.2.omg.howdoi.website"}]
    // curl -k -H 'Authorization: Basic <snip>' https://epinio.172.27.0.2.omg.howdoi.website/api/v1/orgs/workspace/applications
    // store.dispatch('epinio/loadAll', {
    //   type: EPINIO_TYPES.APP,
    //   data: [{
    //     id:   'app1',
    //     name:     'app1',
    //     type: EPINIO_TYPES.APP
    //   }]
    // });

    // Sample Org
    // ["workspace"]
    // curl -k -H 'Authorization: Basic <snip>' https://epinio.172.27.0.2.omg.howdoi.website/api/v1/orgs

    // This is our own resource type, not from api
    store.dispatch(`${ EPINIO_PRODUCT_NAME }/loadAll`, {
      type:     EPINIO_TYPES.INSTANCE,
      data: [{
        id:       '1',
        name:     'my epinio instance',
        api:      '<url of epinio api>',
        username: 'usfds',
        password: 'pasd',
        type:     EPINIO_TYPES.INSTANCE
      }]
    });

    // TODO: RC DISCUSS rancher schemas are user dependent so are loaded on auth via `loadManagement`
    // For epinio we create mock rancher schemas for endpoints that power all the generic components
    // At some point schemas will need to reflect user privileges, but not at the moment
    store.dispatch(`${ EPINIO_PRODUCT_NAME }/loadSchemas`);
  },
  store: storeInit,

};
