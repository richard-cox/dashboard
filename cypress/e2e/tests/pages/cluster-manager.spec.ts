import ClusterManagerListPagePo from '@/cypress/e2e/po/pages/cluster-manager/cluster-manager-list.po';
import ClusterManagerDetailRke2CustomPagePo from '@/cypress/e2e/po/pages/cluster-manager/types/cluster-manager-detail-rke2-custom.po';
import PromptRemove from '~/cypress/e2e/po/components/prompts/promptRemove.po';
import ClusterManagerCreateRke2CustomPagePo from '~/cypress/e2e/po/pages/cluster-manager/create/cluster-manager-create-rke2-custom.po';
import ClusterManagerEditGenericPagePo from '~/cypress/e2e/po/pages/cluster-manager/edit/cluster-manager-edit-generic.po';
import ClusterManagerEditRke2CustomPagePo from '~/cypress/e2e/po/pages/cluster-manager/edit/cluster-manager-edit-rke2-custom.po';
import ClusterManagerImportGenericPagePo from '~/cypress/e2e/po/pages/cluster-manager/import/cluster-manager-import.generic.po';
import ClusterManagerDetailGenericImportPagePo from '~/cypress/e2e/po/pages/cluster-manager/types/cluster-manager-detail-generic-import.po';
import ClusterDashboardPagePo from '~/cypress/e2e/po/pages/explorer/cluster-dashboard.po';

const { baseUrl } = Cypress.config();
// const clusterManagerPath = `${ baseUrl }/c/local/manager/provisioning.cattle.io.cluster`;
const clusterRequestBase = `${ baseUrl }/v1/provisioning.cattle.io.clusters/fleet-default`;
const timestamp = +new Date();
const clusterNamePartial = `e2e-test-${ timestamp }-create`;
const clusterName = `${ clusterNamePartial }`;
const clusterNameImport = `${ clusterNamePartial }-import`;

describe.only('Cluster Manager', () => {
  const listPage = new ClusterManagerListPagePo();
  const createClusterPage = new ClusterManagerCreateRke2CustomPagePo();
  const editImportedClusterPage = new ClusterManagerEditGenericPagePo(clusterNameImport);

  const importClusterPage = new ClusterManagerImportGenericPagePo();
  const editCreatedClusterPage = new ClusterManagerEditRke2CustomPagePo(clusterName);

  beforeEach(() => {
    cy.login();
  });

  it('can create new RKE2 custom cluster', () => {
    cy.userPreferences();

    listPage.goTo();
    listPage.checkIsCurrentPage();
    listPage.create();

    createClusterPage.waitForPage();
    createClusterPage.rkeToggle().toggle();
    createClusterPage.selectCreate(0);
    createClusterPage.nameNsDescription().name().set(clusterName);
    createClusterPage.create();

    const detailClusterPage = new ClusterManagerDetailRke2CustomPagePo(clusterName);

    detailClusterPage.waitForPage(undefined, 'registration');
  });

  it.only('can create new imported generic cluster', () => {
    listPage.goTo();
    listPage.checkIsCurrentPage();
    listPage.import();

    importClusterPage.waitForPage('mode=import');
    importClusterPage.selectGeneric(0);
    importClusterPage.nameNsDescription().name().set(clusterNameImport);
    importClusterPage.create();

    const detailClusterPage = new ClusterManagerDetailGenericImportPagePo(clusterNameImport);

    detailClusterPage.waitForPage(undefined, 'registration');
  });

  it.only('can navigate to imported cluster edit page', () => {
    listPage.goTo();
    listPage.list().actionMenu(clusterNameImport).clickMenuItem(0);

    editImportedClusterPage.waitForPage('mode=edit');
  });

  it('can navigate to local cluster explore product', () => {
    const clusterName = 'local';

    listPage.goTo();
    listPage.list().explore(clusterName);

    const clusterDashboard = new ClusterDashboardPagePo(clusterName);

    clusterDashboard.waitForPage(undefined, 'cluster-events');

    // cy.visit(clusterManagerPath);
    // Click explore button for the cluster row within the table matching given name
    // cy.contains(clusterName).parent().parent().parent()
    //   .within(() => cy.getId('cluster-manager-list-explore-management').click());
    // cy.url().should('include', `/c/${ clusterName }/explorer`);
  });

  it('can edit RKE2 custom cluster and see changes afterwards', () => {
    cy.intercept('PUT', `${ clusterRequestBase }/${ clusterName }`).as('saveRequest');

    listPage.goTo();
    listPage.list().actionMenu(clusterName).clickMenuItem(0);

    editCreatedClusterPage.waitForPage('mode=edit', 'basic');
    editCreatedClusterPage.nameNsDescription().description().set(clusterName);
    editCreatedClusterPage.create();// TODO: RC name/save?
    // cy.visit(clusterManagerPath);
    // Click action menu button for the cluster row within the table matching given name
    // cy.contains(clusterName).parent().parent().parent()
    //   .within(() => cy.getId('-action-button', '$').click());
    // cy.getId('action-menu-0-item').click();
    // cy.getId('name-ns-description-description').type(clusterName);
    // cy.getId('rke2-custom-create-save').click();

    cy.wait('@saveRequest').then(() => {
      // cy.visit(`${ clusterManagerPath }/fleet-default/${ clusterName }?mode=edit#basic`);
      // cy.getId('name-ns-description-description').find('input').should('have.value', clusterName);

      listPage.goTo();
      listPage.list().actionMenu(clusterName).clickMenuItem(0);

      editCreatedClusterPage.waitForPage('mode=edit', 'basic');
      editCreatedClusterPage.nameNsDescription().description().self().should('have.value', clusterName);
    });
  });

  it('can view RKE2 cluster YAML editor', () => {
    listPage.goTo();
    listPage.list().actionMenu(clusterName).clickMenuItem(1);

    editCreatedClusterPage.waitForPage('mode=view&as=yaml');
    editCreatedClusterPage.cruResource().resourceYaml().checkVisible();
    // cy.visit(clusterManagerPath);
    // // Click action menu button for the cluster row within the table matching given name
    // cy.contains(clusterName).parent().parent().parent()
    //   .within(() => cy.getId('-action-button', '$').click());
    // cy.getId('action-menu-1-item').click();
    // cy.getId('yaml-editor-code-mirror').contains(clusterName);
  });

  it('can delete RKE2 cluster', () => {
    cy.intercept('DELETE', `${ clusterRequestBase }/${ clusterName }`).as('deleteRequest');

    listPage.goTo();

    listPage.list().rows().contains(clusterName).as('rowCell');
    listPage.list().actionMenu(clusterName).clickMenuItem(4);

    const promptRemove = new PromptRemove();

    promptRemove.confirm(clusterName);
    promptRemove.remove();

    cy.wait('@deleteRequest').then(() => {
      cy.get('@rowCell').should('not.exist');
    });

    // cy.visit(clusterManagerPath);
    // // Click action menu button for the cluster row within the table matching given name
    // cy.contains(clusterName).as('rowCell').parent().parent()
    //   .parent()
    //   .within(() => cy.getId('-action-button', '$').click());
    // cy.getId('action-menu-4-item').click();
    // cy.getId('prompt-remove-input').type(clusterName);
    // cy.getId('prompt-remove-confirm-button').click();

    // cy.wait('@deleteRequest').then(() => {
    //   cy.get('@rowCell').should('not.exist');
    // });
  });

  it('can delete imported cluster by bulk actions', () => {
    cy.intercept('DELETE', `${ clusterRequestBase }/${ clusterNameImport }`).as('deleteRequest');

    listPage.goTo();

    listPage.list().rows().contains(clusterNameImport).as('rowCell');
    listPage.list().checkbox(clusterNameImport).set();
    listPage.list().bulkAction('Delete').click();

    const promptRemove = new PromptRemove();

    promptRemove.confirm(clusterName);
    promptRemove.remove();

    // cy.visit(clusterManagerPath);
    // // Get row from a given name
    // cy.contains(clusterNameImport).as('rowCell')
    //   // Click checkbox for the cluster row within the table matching given name
    //   .parent().parent()
    //   .parent()
    //   .within(() => cy.getId('-checkbox', '$').click({ multiple: true }));
    // Single buttons are replaced with action menu on mobile
    // cy.getId('sortable-table-promptRemove').click({ force: true });
    // cy.get('@rowCell').then((row) => {
    //   // In the markdown we have ALWAYS whitespace
    //   cy.getId('prompt-remove-input').type(row.text().trim());
    // });
    // cy.getId('prompt-remove-confirm-button').click();

    cy.wait('@deleteRequest').then(() => {
      cy.get('@rowCell').should('not.exist');
    });
  });
});
