import ResourceTablePo from '~/cypress/e2e/po/components/resource-table.po';
import ComponentPo from '@/cypress/e2e/po/components/component.po';
import ResourceListMastheadPo from '~/cypress/e2e/po/components/ResourceList/resource-list-masthead.po';

export default class ProvClusterListPo extends ComponentPo {
  explore(clusterName: string) {
    return this.resourceTable().sortableTable().rowWithName(clusterName).column(7)
      .find('.btn');
  }

  actionMenu(clusterName: string) {
    return this.resourceTable().sortableTable().rowActionMenuOpen(clusterName, 8);
  }

  masthead() {
    return new ResourceListMastheadPo(this.self());
  }

  resourceTable() {
    return new ResourceTablePo(this.self());
  }
}
