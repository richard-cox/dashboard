import CheckboxInputPo from '~/cypress/e2e/po/components/checkbox-input.po';
import ListPo from '~/cypress/e2e/po/components/list.po';

export default class ProvClusterListPo extends ListPo {
  explore(clusterName: string) {
    return this.rowWithName(clusterName).column(7).find('.btn');
  }

  actionMenu(clusterName: string) {
    this.rowWithName(clusterName).column(8).find('.btn').click();

    return this.findActionMenu();
  }

  checkbox(clusterName: string) {
    return new CheckboxInputPo(this.rowWithName(clusterName).column(0));
  }
}
