import {
  AGE, NAME as NAME_COL, STATE, READY, VERSION, NAMESPACE, NODE_NAME, STATUS,
} from '@shell/config/table-headers';
import {
  CAPI,
  CATALOG,
  NORMAN,
  HCI,
  FLEET,
  PVC,
  NETWORK_POLICY,
  EVENT,
} from '@shell/config/types';
import { MULTI_CLUSTER } from '@shell/store/features';
import { DSL } from '@shell/store/type-map';
import { BLANK_CLUSTER } from '@shell/store';

export const NAME = 'manager';

export function init(store) {
  const {
    product,
    basicType,
    headers,
    configureType,
    virtualType,
    weightType,
    weightGroup
  } = DSL(store, NAME);

  product({
    ifHaveType:          CAPI.RANCHER_CLUSTER,
    ifFeature:           MULTI_CLUSTER,
    inStore:             'management',
    icon:                'cluster-management',
    removable:           false,
    showClusterSwitcher: false,
    to:                   {
      name:   'c-cluster-product-resource',
      params: {
        cluster:  BLANK_CLUSTER,
        product:  NAME,
        resource: CAPI.RANCHER_CLUSTER
      }
    },
  });

  virtualType({
    name:        'cloud-credentials',
    labelKey:    'manager.cloudCredentials.label',
    group:      'Root',
    namespaced:  false,
    icon:       'globe',
    weight:      99,
    route:       { name: 'c-cluster-manager-cloudCredential' },
  });

  virtualType({
    labelKey:       'legacy.psps',
    name:           'pod-security-policies',
    group:          'Root',
    namespaced:     false,
    weight:         0,
    icon:           'folder',
    route:          { name: 'c-cluster-manager-pages-page', params: { cluster: 'local', page: 'pod-security-policies' } },
    exact:          true
  });

  basicType([
    CAPI.RANCHER_CLUSTER,
    'cloud-credentials',
    'drivers',
    'pod-security-policies',
  ]);

  configureType(CAPI.RANCHER_CLUSTER, {
    showListMasthead: false, namespaced: false, alias: [HCI.CLUSTER]
  });
  // configureType(NORMAN.CLOUD_CREDENTIAL, { showListMasthead: false, namespaced: false });
  weightType(CAPI.RANCHER_CLUSTER, 100, true);
  weightType('cloud-credentials', 99, true);
  weightType('drivers', 98, true);
  weightType(CATALOG.CLUSTER_REPO, 97, true);

  configureType(NORMAN.CLOUD_CREDENTIAL, {
    showState: false, showAge: false, canYaml: false
  });

  virtualType({
    labelKey:   'manager.drivers.label',
    name:       'drivers',
    group:      'Root',
    namespaced: false,
    icon:       'globe',
    route:      { name: 'c-cluster-manager-pages-page', params: { cluster: 'local', page: 'rke-drivers' } },
    exact:      true
  });

  virtualType({
    labelKey:   'manager.rkeTemplates.label',
    name:       'rke-templates',
    group:      'Root',
    namespaced: false,
    icon:       'globe',
    route:      { name: 'c-cluster-manager-pages-page', params: { cluster: 'local', page: 'rke-templates' } },
    exact:      true
  });

  virtualType({
    labelKey:   'manager.nodeTemplates.label',
    name:       'rke-node-templates',
    group:      'Root',
    namespaced: false,
    icon:       'globe',
    route:      { name: 'c-cluster-manager-pages-page', params: { cluster: 'local', page: 'node-templates' } },
    exact:      true
  });

  basicType([
    'rke-templates',
    'rke-node-templates'
  ], 'RKE1Configuration');

  weightType(CAPI.MACHINE_DEPLOYMENT, 3, true);
  weightType(CAPI.MACHINE_SET, 2, true);
  weightType(CAPI.MACHINE, 1, true);
  weightType(CATALOG.CLUSTER_REPO, 0, true);

  configureType(CATALOG.CLUSTER_REPO, { showListMasthead: false });

  basicType([
    CAPI.MACHINE_DEPLOYMENT,
    CAPI.MACHINE_SET,
    CAPI.MACHINE,
    CATALOG.CLUSTER_REPO,
  ], 'advanced');

  weightGroup('advanced', -1, true);

  const MACHINE_SUMMARY = {
    name:      'summary',
    labelKey:  'tableHeaders.machines',
    sort:      false,
    search:    false,
    formatter: 'MachineSummaryGraph',
    align:     'center',
    width:     100,
  };

  headers(CAPI.RANCHER_CLUSTER, [
    STATE,
    {
      name:          'name',
      labelKey:      'tableHeaders.name',
      value:         'nameDisplay',
      sort:          ['nameSort'],
      formatter:     'ClusterLink',
      canBeVariable: true,
    },
    {
      name:     'kubernetesVersion',
      labelKey: 'tableHeaders.version',
      value:    'kubernetesVersion',
      sort:     'kubernetesVersion',
      search:   'kubernetesVersion',
    },
    {
      name:      'provider',
      labelKey:  'tableHeaders.provider',
      value:     'machineProvider',
      sort:      ['machineProvider', 'provisioner'],
      formatter: 'ClusterProvider',
    },
    MACHINE_SUMMARY,
    AGE,
    {
      name:  'explorer',
      label: ' ',
      align: 'right',
      width: 65,
    },
  ]);

  headers(CAPI.MACHINE_DEPLOYMENT, [
    STATE,
    NAME_COL,
    MACHINE_SUMMARY,
    AGE
  ]);

  headers(CAPI.MACHINE_SET, [
    STATE,
    NAME_COL,
    NAMESPACE,
    {
      name:      'cluster',
      labelKey:  'tableHeaders.cluster',
      value:     'cluster',
      sort:      'cluster',
    },
    {
      name:      'desired',
      labelKey:  'tableHeaders.desired',
      value:     'desired',
      sort:      'desired',
    },
    {
      name:      'replicas',
      labelKey:  'tableHeaders.replicas',
      value:     'replicas',
      sort:      'replicas',
    },
    READY,
    {
      name:      'available',
      labelKey:  'tableHeaders.available',
      value:     'available',
      sort:      'available',
    },
    AGE,
    VERSION
  ]);

  headers(CAPI.MACHINE, [
    STATE,
    NAME_COL,
    NAMESPACE,
    {
      name:      'cluster',
      labelKey:  'tableHeaders.cluster',
      value:     'cluster',
      sort:      'cluster',
    },
    NODE_NAME,
    {
      name:      'providerId',
      labelKey:  'tableHeaders.providerId',
      value:     'providerId',
      sort:      'providerId',
    },
    READY,
    {
      name:      'phase',
      labelKey:  'tableHeaders.phase',
      value:     'phase',
      sort:      'phase',
    },
    AGE,
    VERSION
  ]);

  headers( FLEET.TOKEN, [
    STATE,
    NAME_COL,
    NAMESPACE,
    {
      name:      'secretName',
      labelKey:  'tableHeaders.secretName',
      value:     'secretName',
      sort:      'secretName',
    },
  ]);

  headers( PVC, [
    STATE,
    NAME_COL,
    NAMESPACE,
    STATUS,
    {
      name:      'volume',
      labelKey:  'tableHeaders.volume',
      value:     'volume',
      sort:      'volume',
    },
    {
      name:      'capacity',
      labelKey:  'tableHeaders.capacity',
      value:     'capacity',
      sort:      'capacity',
    },
    {
      name:      'accessModes',
      labelKey:  'tableHeaders.accessModes',
      value:     'accessModes',
      sort:      'accessModes',
    },
    {
      name:      'storageClass',
      labelKey:  'tableHeaders.storageClass',
      value:     'storageClass',
      sort:      'storageClass',
    },
    {
      name:      'volumeMode',
      labelKey:  'tableHeaders.volumeMode',
      value:     'volumeMode',
      sort:      'volumeMode',
    },
    AGE
  ]);

  headers( NETWORK_POLICY, [
    STATE,
    NAME_COL,
    NAMESPACE,
    {
      name:      'podSelector',
      labelKey:  'tableHeaders.podSelector',
      value:     'podSelector',
      sort:      'secrpodSelectoretName',
    },
    AGE
  ]);

  headers( EVENT, [
    STATE,
    {
      name:      'lastSeen',
      labelKey:  'tableHeaders.lastSeen',
      value:     'lastSeen',
      sort:      'lastSeen',
    },
    {
      name:      'type',
      labelKey:  'tableHeaders.type',
      value:     'type',
      sort:      'type',
    },
    {
      name:      'reason',
      labelKey:  'tableHeaders.reason',
      value:     'reason',
      sort:      'reason',
    },
    {
      name:      'object',
      labelKey:  'tableHeaders.object',
      value:     'object',
      sort:      'object',
    },
    {
      name:      'subobject',
      labelKey:  'tableHeaders.subobject',
      value:     'subobject',
      sort:      'subobject',
    },
    {
      name:      'source',
      labelKey:  'tableHeaders.source',
      value:     'source',
      sort:      'source',
    },
    {
      name:      'message',
      labelKey:  'tableHeaders.message',
      value:     'message',
      sort:      'message',
    },
    {
      name:      'firstSeen',
      labelKey:  'tableHeaders.firstSeen',
      value:     'firstSeen',
      sort:      'firstSeen',
    },
    {
      name:      'count',
      labelKey:  'tableHeaders.count',
      value:     'count',
      sort:      'count',
    },
    NAME_COL,
    NAMESPACE
  ]);
}
