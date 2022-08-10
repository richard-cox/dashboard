import PagePo from '@/cypress/e2e/po/pages/page.po';
import ClusterManagerCreateImportPagePo from '~/cypress/e2e/po/pages/cluster-manager/cluster-manager-create-import.po';

export default class ClusterManagerEditRke2CustomPagePo extends ClusterManagerCreateImportPagePo {
  private static createPath(clusterName: string, tab?: string) {
    return `/c/local/manager/provisioning.cattle.io.cluster/fleet-default/${ clusterName }`;
  }

  static goTo(clusterName: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(ClusterManagerEditRke2CustomPagePo.createPath(clusterName));
  }

  constructor(clusterName: string) {
    super(ClusterManagerEditRke2CustomPagePo.createPath(clusterName));
  }
}
