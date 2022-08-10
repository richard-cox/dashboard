import PagePo from '@/cypress/e2e/po/pages/page.po';

export default abstract class ClusterManagerDetailPagePo extends PagePo {
  private static createPath(clusterName: string, tab?: string) {
    return `/c/local/manager/provisioning.cattle.io.cluster/fleet-default/${ clusterName }`;
  }

  static goTo(clusterName: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(ClusterManagerDetailPagePo.createPath(clusterName));
  }

  constructor(clusterName: string) {
    super(ClusterManagerDetailPagePo.createPath(clusterName));
  }
}
