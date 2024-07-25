import ExtensionsPagePo from '@/cypress/e2e/po/pages/extensions.po';

import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import AboutPagePo from '@/cypress/e2e/po/pages/about.po';

const EXTENSION_NAME = 'elemental';

describe('Extensions Compatibility spec', { tags: ['@elemental', '@adminUser'] }, () => {
  beforeEach(() => {
    cy.login();
  });

  it('add main extensions repository', () => {
    // This should be in a `before` however is flaky. Move it to an `it` to let cypress retry
    const extensionsPo = new ExtensionsPagePo();

    extensionsPo.goTo();
    extensionsPo.waitForPage();
    extensionsPo.extensionTabInstalledClick(); // Avoid nav guard failures that probably auto move user to this tab

    // install the rancher plugin examples
    extensionsPo.addExtensionsRepository('https://github.com/rancher/ui-plugin-charts', 'main', 'Rancher Extensions');
  });

  it('can navigate to About page', () => {
    const aboutPage = new AboutPagePo();

    HomePagePo.goToAndWaitForGet();
    AboutPagePo.navTo();
    aboutPage.waitForPage();
    cy.wait(10000); // eslint-disable-line cypress/no-unnecessary-waiting
    // just enough to render the page on sorry-cypress so that we can check the version
  });

  it('Should install an extension', () => {
    const extensionsPo = new ExtensionsPagePo();

    extensionsPo.goTo();

    extensionsPo.extensionTabAvailableClick();

    // click on install button on card
    extensionsPo.extensionCardInstallClick(EXTENSION_NAME);
    extensionsPo.extensionInstallModal().should('be.visible');

    // select version and click install
    extensionsPo.installModalSelectVersionClick(2);
    extensionsPo.installModalInstallClick();

    // let's check the extension reload banner and reload the page
    extensionsPo.extensionReloadBanner().should('be.visible');
    extensionsPo.extensionReloadClick();

    // make sure extension card is in the installed tab
    extensionsPo.extensionTabInstalledClick();
    extensionsPo.extensionCardClick(EXTENSION_NAME);
    extensionsPo.extensionDetailsTitle().should('contain', EXTENSION_NAME);
    extensionsPo.extensionDetailsCloseClick();
  });
});
