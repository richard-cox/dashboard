
import ClusterManagerCreateImportPagePo from '~/cypress/e2e/po/pages/cluster-manager/cluster-manager-create-import.po';

export default class ClusterManagerImportPagePo extends ClusterManagerCreateImportPagePo {
  static url: string = '/c/local/manager/provisioning.cattle.io.cluster/create?mode=import'

  constructor() {
    super(ClusterManagerImportPagePo.url);
  }

  selectKubeProvider(index: number) {
    return this.cruResource().selectSubType(0, index).click();
  }

  selectGeneric(index: number) {
    return this.cruResource().selectSubType(1, index).click();
  }
}
