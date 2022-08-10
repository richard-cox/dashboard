import PagePo from '@/cypress/e2e/po/pages/page.po';

export default abstract class ClusterManagerDetailPagePo extends PagePo {
  private static createPath(clusterName: string, tab?: string) {
    return `/c/local/manager/provisioning.cattle.io.cluster/fleet-default/${ clusterName }${ tab ? `#${ tab }` : '' }`;
  }

  static goTo(clusterName: string, tab?: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(ClusterManagerDetailPagePo.createPath(clusterName, tab));
  }

  constructor(clusterName: string, tab?: string) {
    super(ClusterManagerDetailPagePo.createPath(clusterName, tab));
  }
}
