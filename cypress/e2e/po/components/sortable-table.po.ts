import ComponentPo from '@/cypress/e2e/po/components/component.po';
import ActionMenuPo from '~/cypress/e2e/po/components/action-menu.po';
import CheckboxInputPo from '~/cypress/e2e/po/components/checkbox-input.po';
import ListRowPo from '~/cypress/e2e/po/components/list-row.po';

export default class SortableTablePo extends ComponentPo {
  //
  // sortable-table-header
  //

  bulkActionDropDown() {
    return this.self().find(`.fixed-header-actions .bulk .bulk-actions-dropdown`);
  }

  bulkActionDropDownOpen() {
    return this.bulkActionDropDown().click();
  }

  bulkActionDropDownPopOver() {
    return this.bulkActionDropDown().find(`.v-popover .popover .popover-inner`);
  }

  /**
   * Get a visible bulk action button
   */
  bulkActionDropDownButton(name: string) {
    const popOver = this.bulkActionDropDownPopOver();

    popOver.should('be.visible');

    return popOver.find('li').contains(name);
  }

  //
  // sortable-table
  //

  rows() {
    return this.self().find('tbody tr');
  }

  rowElementWithName(name: string) {
    return this.self().contains('tbody tr', new RegExp(` ${ name } `));
  }

  row(index: number) {
    return new ListRowPo(this.rows().eq(index));
  }

  rowWithName(name: string) {
    return new ListRowPo(this.rowElementWithName(name));
  }

  rowActionMenu() {
    return new ActionMenuPo();
  }

  rowActionMenuOpen(name: string, actionMenuColumn: number) {
    // Open action menu
    this.rowWithName(name).column(actionMenuColumn)
      .find('.btn')
      .click();

    // Find opened action menu element
    return this.rowActionMenu();
  }

  rowSelectCtlWithName(clusterName: string) {
    return new CheckboxInputPo(this.rowWithName(clusterName).column(0));
  }
}
