import PagePo from '@/cypress/e2e/po/pages/page.po';
import CreateEditViewPo from '@/cypress/e2e/po/components/create-edit-view.po';
import NameNsDescription from '@/cypress/e2e/po/components/name-ns-description.po';
import CruResourcePo from '~/cypress/e2e/po/components/cru-resource.po';

export default abstract class ClusterManagerCreateImportPagePo extends PagePo {
  cruResource() {
    return new CruResourcePo(this.self().find('.cru'));
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
