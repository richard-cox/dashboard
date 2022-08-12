import ComponentPo from '@/cypress/e2e/po/components/component.po';

export default class ResourceListMastheadPo extends ComponentPo {
  headerActions() {
    return this.self().get('.actions-container .actions .btn');
  }
}
