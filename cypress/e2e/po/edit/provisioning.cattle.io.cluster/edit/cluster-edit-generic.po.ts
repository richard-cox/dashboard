import ClusterManagerCreateImportPagePo from '~/cypress/e2e/po/edit/provisioning.cattle.io.cluster/cluster-create-import.po';

export default class ClusterManagerEditGenericPagePo extends ClusterManagerCreateImportPagePo {
  private static createPath(clusterName: string, tab?: string) {
    return `/c/local/manager/provisioning.cattle.io.cluster/fleet-default/${ clusterName }`;
  }

  static goTo(clusterName: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(ClusterManagerEditGenericPagePo.createPath(clusterName));
  }

  constructor(clusterName: string) {
    super(ClusterManagerEditGenericPagePo.createPath(clusterName));
  }
}
