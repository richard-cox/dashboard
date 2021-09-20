import { NAME, SIMPLE_NAME } from '@/config/table-headers';
import { DSL } from '@/store/type-map';
import { EXTENSION_PREFIX } from '~/utils/extensions';

export const EPINIO_PRODUCT_NAME = 'epinio';

// TODO: RC DISCUSS Comment routing is <extension>-c-<epinio instance>-<epinio resource>
// TODO: RC DISCUSS Handle localisation in plugins

const rootRoute = {
  name:    `${ EXTENSION_PREFIX }-epinio`,
  params:  { e: EPINIO_PRODUCT_NAME },
};

const createRoute = (name, params) => ({
  name:   `${ rootRoute.name }-${ name }`,
  params: {
    ...rootRoute.params,
    ...params
  }
});

export const EPINIO_TYPES = {
  INSTANCE: 'instance',
  APP:      'applications',
  ORG:      'orgs'
};

export function init(store) {
  const {
    product,
    basicType,
    headers,
    configureType,
    componentForType
  } = DSL(store, EPINIO_PRODUCT_NAME);

  product({
    // ifHaveType:          CAPI.RANCHER_CLUSTER,
    // ifFeature:           MULTI_CLUSTER,
    category:            EPINIO_PRODUCT_NAME,
    inStore:             EPINIO_PRODUCT_NAME,
    icon:                'cluster-management',
    removable:           false,
    showClusterSwitcher: false,
    to:                  rootRoute
  });

  configureType(EPINIO_TYPES.INSTANCE, { customRoute: createRoute('c-cluster-resource', { resource: EPINIO_TYPES.INSTANCE }) });

  componentForType(EPINIO_TYPES.APP, undefined, EPINIO_PRODUCT_NAME);
  configureType(EPINIO_TYPES.APP, {
    isCreatable: true,
    showState:   false,
    showAge:     false,
    canYaml:     false,
    customRoute: createRoute('c-cluster-resource', { resource: EPINIO_TYPES.APP })
  });

  configureType(EPINIO_TYPES.ORG, { customRoute: createRoute('c-cluster-resource', { resource: EPINIO_TYPES.ORG }) });

  basicType([
    EPINIO_TYPES.APP,
    EPINIO_TYPES.ORG
  ]);

  headers(EPINIO_TYPES.APP, [
    NAME,
  ]);

  headers(EPINIO_TYPES.ORG, [
    SIMPLE_NAME,
  ]);

  headers(EPINIO_TYPES.INSTANCE, [
    SIMPLE_NAME, {
      name:     'api',
      labelKey: 'API', // TODO: RC i10n
      value:    'api',
      sort:     ['api'],
    },
    {
      name:     'pick',
      labelKey: 'Pick', // TODO: RC i10n
    }
  ]);
}
