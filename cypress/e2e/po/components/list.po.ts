import ComponentPo from '@/cypress/e2e/po/components/component.po';
import ActionMenuPo from '~/cypress/e2e/po/components/action-menu.po';
import ListRowPo from '~/cypress/e2e/po/components/list-row.po';

export default class ListPo extends ComponentPo {
  findActionMenu() {
    return new ActionMenuPo();
  }

  headerActions() {
    return this.self().get('.actions-container .actions .btn');
  }

  rows() {
    return this.self().find('tbody tr');
  }

  row(index: number) {
    return new ListRowPo(this.rows().eq(index));
  }

  rowWithName(name: string) {
    // 'td span a'
    return new ListRowPo(this.self().contains('tbody tr', new RegExp(` ${ name } `)));
  }

  bulkAction(name: string) {
    return this.self().find('.fixed-header-actions button').contains(` ${ name } `);
  }
}
