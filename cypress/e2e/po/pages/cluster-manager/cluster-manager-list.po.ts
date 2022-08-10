import PagePo from '@/cypress/e2e/po/pages/page.po';
import ProvClusterListPo from '~/cypress/e2e/po/components/lists/provisioning.cattle.io.cluster.po';

export default class ClusterManagerListPagePo extends PagePo {
  static url: string = '/c/local/manager/provisioning.cattle.io.cluster'
  static goTo(): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(ClusterManagerListPagePo.url);
  }

  constructor() {
    super(ClusterManagerListPagePo.url);
  }

  list(): ProvClusterListPo {
    return new ProvClusterListPo(this.self().find('[data-testid="cluster-list"]'));
  }

  import() {
    return this.list().headerActions().eq(0).click();
  }

  create() {
    return this.list().headerActions().eq(1).click();
  }
}
