import { RouteConfig } from 'vue-router';

import { EXTENSION_PREFIX } from '../utils/custom-routing';
import { EPINIO_PRODUCT_NAME } from '../types';

import CreateApp from '../pages/c/_cluster/applications/createapp/index.vue';
import ListApp from '../pages/c/_cluster/applications/index.vue';
import ListEpinio from '../pages/index.vue';
import ViewEpinioBase from '../pages/c/index.vue';
import ViewEpinio from '../pages/c/_cluster/index.vue';
import ListEpinioResource from '../pages/c/_cluster/_resource/index.vue';
import CreateEpinioResource from '../pages/c/_cluster/_resource/create.vue';
import ViewEpinioResource from '../pages/c/_cluster/_resource/_id.vue';
import ViewEpinioNsResource from '../pages/c/_cluster/_resource/_namespace/_id.vue';

const routes: RouteConfig[] = [{
  name:      `${ EXTENSION_PREFIX }-${ EPINIO_PRODUCT_NAME }-c-cluster-applications-createapp`,
  path:      `/${ EXTENSION_PREFIX }/epinio/c/:cluster/applications/createapp`,
  component: CreateApp,
}, {
  name:      `${ EXTENSION_PREFIX }-${ EPINIO_PRODUCT_NAME }-c-cluster-applications`,
  path:      `/${ EXTENSION_PREFIX }/epinio/c/:cluster/applications`,
  component: ListApp,
}, {
  name:      `${ EXTENSION_PREFIX }-${ EPINIO_PRODUCT_NAME }`,
  path:      `/${ EXTENSION_PREFIX }/epinio`,
  component: ListEpinio,
}, {
  name:      `${ EXTENSION_PREFIX }-${ EPINIO_PRODUCT_NAME }-c`,
  path:      `/${ EXTENSION_PREFIX }/epinio/c`,
  component: ViewEpinioBase,
}, {
  name:      `${ EXTENSION_PREFIX }-${ EPINIO_PRODUCT_NAME }-c-cluster`,
  path:      `/${ EXTENSION_PREFIX }/epinio/c/:cluster`,
  component: ViewEpinio,
}, {
  name:      `${ EXTENSION_PREFIX }-${ EPINIO_PRODUCT_NAME }-c-cluster-resource`,
  path:      `/${ EXTENSION_PREFIX }/epinio/c/:cluster/:resource`,
  component: ListEpinioResource,
}, {
  name:      `${ EXTENSION_PREFIX }-${ EPINIO_PRODUCT_NAME }-c-cluster-resource-create`,
  path:      `/${ EXTENSION_PREFIX }/epinio/c/:cluster/:resource/create`,
  component: CreateEpinioResource,
}, {
  name:      `${ EXTENSION_PREFIX }-${ EPINIO_PRODUCT_NAME }-c-cluster-resource-id`,
  path:      `/${ EXTENSION_PREFIX }/epinio/c/:cluster/:resource/:id`,
  component: ViewEpinioResource,
}, {
  name:      `${ EXTENSION_PREFIX }-${ EPINIO_PRODUCT_NAME }-c-cluster-resource-namespace-id`,
  path:      `/${ EXTENSION_PREFIX }/epinio/c/:cluster/:resource/:namespace/:id`,
  component: ViewEpinioNsResource,
}];

export default routes;
