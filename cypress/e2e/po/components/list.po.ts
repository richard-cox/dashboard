import ComponentPo from '@/cypress/e2e/po/components/component.po';

export default class ListPo extends ComponentPo {
  headerActions() {
    return this.self().get('.actions-container .actions .btn');
  }
}
