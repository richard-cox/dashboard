
import { EPINIO_TYPES, init as productInit } from '@/plugins/app-extension/epinio/config/product/epinio';
import storeInit from '@/plugins/app-extension/epinio/store';

let applied = false;

export default {
  init(store) {
    if (applied) {
      // TODO: RC FIX called on page change, better solution?
      return;
    }
    applied = true;
    productInit(store);
    storeInit()(store);

    // Sample App
    // [{"name":"sample","organization":"workspace","status":"Inactive, without workload. Launch via \"epinio app push\""}]
    // [{"active":true,"stage_id":"9814a9f9e6dc6922","name":"sample","organization":"workspace","status":"0/1","route":"sample.172.27.0.2.omg.howdoi.website"}]
    // curl -k -H 'Authorization: Basic <snip>' https://epinio.172.27.0.2.omg.howdoi.website/api/v1/orgs/workspace/applications
    // TODO: RC current format is api/v1/orgs/workspace/applications
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
    store.dispatch('epinio/loadAll', {
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
  }
};
