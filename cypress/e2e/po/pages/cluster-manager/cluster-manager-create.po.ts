import PagePo from '@/cypress/e2e/po/pages/page.po';
import CreateEditViewPo from '@/cypress/e2e/po/components/create-edit-view.po';
import NameNsDescription from '@/cypress/e2e/po/components/name-ns-description.po';

import ToggleSwitchPo from '@/cypress/e2e/po/components/toggle-switch.po';
import CruResourcePo from '~/cypress/e2e/po/components/cru-resource';

export default abstract class ClusterManagerCreatePagePo extends PagePo {
  static url: string = '/c/local/manager/provisioning.cattle.io.cluster/create'
  static goTo(): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(ClusterManagerCreatePagePo.url);
  }

  constructor() {
    super(ClusterManagerCreatePagePo.url);
  }

  rkeToggle() {
    return new ToggleSwitchPo(this.self().find('.toggle-container'));
  }

  private cruResource() {
    return new CruResourcePo(this.self().find('.cru'));
  }

  selectKubeProvider(index: number) {
    return this.cruResource().selectSubType(1, index).click();
  }

  selectCreate(index: number) {
    return this.cruResource().selectSubType(2, index).click();
  }

  selectCustom(index: number) {
    return this.cruResource().selectSubType(3, index).click();
  }

  // Form

  createEditView() {
    return new CreateEditViewPo(this.self());
  }

  nameNsDescription() {
    return new NameNsDescription(this.self());
  }

  create() {
    return this.createEditView().create();
  }
}
