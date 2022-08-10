import ToggleSwitchPo from '~/cypress/e2e/po/components/toggle-switch.po';
import ClusterManagerCreateImportPagePo from '~/cypress/e2e/po/pages/cluster-manager/cluster-manager-create-import.po';

export default abstract class ClusterManagerCreatePagePo extends ClusterManagerCreateImportPagePo {
  static url: string = '/c/local/manager/provisioning.cattle.io.cluster/create'

  constructor() {
    super(ClusterManagerCreatePagePo.url);
  }

  rkeToggle() {
    return new ToggleSwitchPo(this.self().find('.toggle-container'));
  }

  selectKubeProvider(index: number) {
    return this.cruResource().selectSubType(0, index).click();
  }

  selectCreate(index: number) {
    return this.cruResource().selectSubType(1, index).click();
  }

  selectCustom(index: number) {
    return this.cruResource().selectSubType(2, index).click();
  }
}
