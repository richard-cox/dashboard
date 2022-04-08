import { importTypes } from '@rancher/auto-import';
import { IPlugin, OnEnterPackage, OnLeavePackage } from '@shell/core/types';
import epinioStore from './store/epinio-store';
import epinioMgmtStore from './store/epinio-mgmt-store';
import epinioRoutes from './routing/epinio-routing';

import enUS from './translations/en-us.yaml';

// Init the package
export default function(plugin: IPlugin) {
  // Auto-import model, detail, edit from the folders
  importTypes(plugin);

  // Provide plugin metadata from package.json
  plugin.metadata = require('./package.json');

  plugin.metadata.description = 'Application Development Engine for Kubernetes';
  plugin.metadata.name = 'Epinio';
  plugin.metadata.version = '0.6.2'; // TODO: RC Q take from package.json?

  // plugin.addI18n('en-us', loadI10n('en-us'));
  plugin.addI18n('en-us', enUS);

  // Load a product
  plugin.addProduct(require('./config/epinio'));

  plugin.addCoreStore(epinioMgmtStore.config.namespace, epinioMgmtStore.specifics, epinioMgmtStore.config);
  plugin.addCoreStore(epinioStore.config.namespace, epinioStore.specifics, epinioStore.config);

  epinioRoutes.forEach(route => plugin.addRoute(route));

  const onEnter: OnEnterPackage = async(store, config) => {
    await store.dispatch(`${ epinioStore.config.namespace }/loadManagement`);
    if (config.clusterId) {
      await store.dispatch('loadCluster', {
        id:         config.clusterId,
        product:    config.product,
        oldProduct: config.oldProduct,
        isExt:      true,
        oldIsExt:   config.oldIsExt,
      });
    }
  };
  const onLeave: OnLeavePackage = () => Promise.resolve();

  plugin.addOnEnterLeaveHooks(onEnter, onLeave);
}
