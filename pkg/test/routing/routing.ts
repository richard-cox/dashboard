
import { RouteConfig } from 'vue-router';
import TestExplorer from '../pages/c/_cluster/test-explorer.vue';

const routes: RouteConfig[] = [
  {
    name:      `c-cluster-test`,
    path:      `/c/:cluster/test`,
    component: TestExplorer,
  },
];

export default routes;
