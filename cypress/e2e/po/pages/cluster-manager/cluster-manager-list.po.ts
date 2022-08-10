import PagePo from '@/cypress/e2e/po/pages/page.po';
import ListPo from '@/cypress/e2e/po/components/list.po';

export default class ClusterManagerListPagePo extends PagePo {
  static url: string = '/c/local/manager/provisioning.cattle.io.cluster'
  static goTo(): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(ClusterManagerListPagePo.url);
  }

  constructor() {
    super(ClusterManagerListPagePo.url);
  }

  list(): ListPo {
    return new ListPo(this.self().find('[data-testid="cluster-list"]'));
  }

  import() {
    return this.list().headerActions().eq(0).click();
  }

  create() {
    return this.list().headerActions().eq(1).click();
  }
}
