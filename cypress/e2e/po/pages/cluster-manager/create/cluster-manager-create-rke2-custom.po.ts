import PagePo from '@/cypress/e2e/po/pages/page.po';
import ClusterManagerCreatePagePo from '~/cypress/e2e/po/pages/cluster-manager/create/cluster-manager-create.po';

export default class ClusterManagerCreateRke2CustomPagePo extends ClusterManagerCreatePagePo {
  static url: string = `${ ClusterManagerCreatePagePo.url }/create?type=custom#basic`
  static goTo(): Cypress.Chainable<Cypress.AUTWindow> {
    return PagePo.goTo(ClusterManagerCreateRke2CustomPagePo.url);
  }
}
