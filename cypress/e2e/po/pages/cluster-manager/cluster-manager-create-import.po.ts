import PagePo from '@/cypress/e2e/po/pages/page.po';
import CreateEditViewPo from '@/cypress/e2e/po/components/create-edit-view.po';
import NameNsDescription from '@/cypress/e2e/po/components/name-ns-description.po';

import CruResourcePo from '~/cypress/e2e/po/components/cru-resource';

export default abstract class ClusterManagerCreateImportPagePo extends PagePo {
  protected cruResource() {
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
