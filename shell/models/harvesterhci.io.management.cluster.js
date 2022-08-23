import Vue from 'vue';
import ProvCluster from '@shell/models/provisioning.cattle.io.cluster';
import { DEFAULT_WORKSPACE } from '@shell/config/types';
import { HARVESTER_NAME, HARVESTER_NAME as VIRTUAL } from '@shell/config/product/harvester-manager';

export default class HciCluster extends ProvCluster {
  get _availableActions() {
    // No actions for Harvester clusters
    return [];
  }

  get stateObj() {
    return this._stateObj;
  }

  applyDefaults() {
    if ( !this.spec ) {
      Vue.set(this, 'spec', { agentEnvVars: [] });
      Vue.set(this, 'metadata', { namespace: DEFAULT_WORKSPACE });
    }
  }

  get isReady() {
    // If the Connected condition exists, use that (2.6+)
    if ( this.hasCondition('Connected') ) {
      return this.isCondition('Connected');
    }

    // Otherwise use Ready (older)
    return this.isCondition('Ready');
  }

  get canEdit() {
    return false;
  }

  cachedHarvesterClusterVersion = '';

  async _pkgDetails() {
    const clusterId = this.mgmt.id;

    // Fetch the version of the pkg to fetch
    // if (!this.cachedHarvesterClusterVersion) {
    //   // Note - The version MUST match the version in the pkg's package.json (and filename)
    //   const versionUrl = `/k8s/clusters/${ clusterId }/v1/harvester/harvesterhci.io.settings/server-version`;
    //   const res = await this.$dispatch('request', { url: versionUrl });

    //   this.cachedHarvesterClusterVersion = res.value;
    // }

    // // Work out the package Name
    // const packageName = `${ HARVESTER_NAME }-${ this.cachedHarvesterClusterVersion }`;

    // // Work out the dashboard url (which contains the harvester pkg)
    // const namespace = 'harvester-system';
    // const serviceName = 'harvester';
    // // Note - We can always fetch this from the embedded version.
    // // Standalone Context - The harv pkg will be built in, so this code is never hit
    // // Rancher Context - We will always go out to the harvester package bundled with the cluster
    // // So we can ignore the ui-index and ui-source (`bundled` `auto`, `external`) settings
    // // TODO: RC cluster members user do not have access to the harvester-system namespace. Seeking input from harv team
    // const dashboardUrl = `/k8s/clusters/${ clusterId }/api/v1/namespaces/${ namespace }/${ SERVICE }s/https:${ serviceName }:8443/proxy/dashboard`;

    // // Use all of above to create the filename and full url of hte package

    let pkgUrl = '';
    let uiInfo = '';
    let fileName = '';
    let packageName = '';
    const infoUrl = `/k8s/clusters/${ clusterId }/v1/harvester/uiinfo`;

    try {
      // fetch pkg from harvester api
      uiInfo = await this.$dispatch('request', { url: infoUrl });
    } catch (e) {
      // TODO: The version number here needs to be saved in one place
      const embeddedPath = 'dashboard/harvester-0.6.0/harvester-0.6.0.umd.min.js';

      pkgUrl = process.env.dev ? `${ process.env.api }/${ embeddedPath }` : embeddedPath;
    }

    if (uiInfo) {
      packageName = `${ HARVESTER_NAME }-${ uiInfo['ui-plugin-bundled-version'] }`;

      fileName = `${ packageName }.umd.min.js`;

      if (uiInfo['ui-source'] === 'bundled' ) { // offline bundled
        pkgUrl = `k8s/clusters/${ clusterId }/v1/harvester/plugin-assets/${ fileName }`;
      } else if (uiInfo['ui-source'] === 'external') {
        if (!uiInfo['ui-plugin-index']) {
          this.$dispatch('growl/error', {
            title:   this.t('harvesterManager.plugins.loadError'),
            message: 'Please configure the correct ui-plugin-index value',
            timeout: 4000
          }, { root: true });
        } else {
          pkgUrl = uiInfo['ui-plugin-index'];
        }
      }
    }

    const names = pkgUrl.split('/');
    const last = names[names.length - 1];

    packageName = last.split('.umd.min.js')[0];

    return {
      pkgUrl,
      packageName
    };
  }

  async loadClusterPlugin() {
    const { pkgUrl, packageName } = await this._pkgDetails();

    console.info('Attempting to load harvester plugin', packageName, pkgUrl); // eslint-disable-line no-console

    return await this.$rootState.$plugin.loadAsync(packageName, pkgUrl);
  }

  goToCluster() {
    this.loadClusterPlugin()
      .then(() => {
        this.currentRouter().push({
          name:   `${ VIRTUAL }-c-cluster-resource`,
          params: {
            cluster:  this.status.clusterName,
            product:  VIRTUAL,
            resource: 'harvesterhci.io.dashboard' // Go directly to dashboard to avoid blip of components on screen
          }
        });
      })
      .catch((err) => {
        const message = typeof error === 'object' ? JSON.stringify(err) : err;

        console.error('Failed to load harvester package: ', message); // eslint-disable-line no-console

        this.$dispatch('growl/error', {
          title:   this.t('harvesterManager.plugins.loadError'),
          message,
          timeout: 5000
        }, { root: true });
      });
  }
}
