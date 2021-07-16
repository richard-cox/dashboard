import { NAME, SIMPLE_NAME } from '@/config/table-headers';
import { DSL } from '@/store/type-map';

export const EPINIO_PRODUCT_NAME = 'epinio';

// TODO: RC Comment routing is <extension>-c-<epinio instance>-<epinio resource>
// TODO: RC Comment Handle localisation in plugins

const rootRoute = {
  name:    'ext-epinio',
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
    virtualType,
    weightType,
    spoofedType,
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

  spoofedType({
    label:      'Instances', // TODO: RC i10n
    type:       EPINIO_TYPES.INSTANCE,
    route:      createRoute('c-cluster-resource', { resource: EPINIO_TYPES.INSTANCE }),
    schemas: [
      {
        product:           EPINIO_PRODUCT_NAME,
        id:                EPINIO_TYPES.INSTANCE,
        type:              'schema',
        collectionMethods: ['post'],
      },
    ],
  });

  spoofedType({

    type:       EPINIO_TYPES.APP,
    route:      createRoute('c-cluster-resource', { resource: EPINIO_TYPES.APP }),
    schemas: [
      {
        label:             'Applications', // TODO: RC i10n
        product:           EPINIO_PRODUCT_NAME,
        id:                EPINIO_TYPES.APP,
        type:              'schema',
        collectionMethods: ['post'],
      },
    ],
  });

  componentForType(EPINIO_TYPES.APP, undefined, EPINIO_PRODUCT_NAME); // TODO: RC should probably store plugin (which is store) in state
  configureType(EPINIO_TYPES.APP, {
    isCreatable: true,
    showState:   false,
    showAge:     false,
    canYaml:     false,
  });

  spoofedType({

    type:       EPINIO_TYPES.ORG,
    route:      createRoute('c-cluster-resource', { resource: EPINIO_TYPES.ORG }),
    schemas: [
      {
        label:             'Organisations', // TODO: RC i10n
        product:           EPINIO_PRODUCT_NAME, // TODO: RC from store instead of product (should be available when called <store>loadSchemas -->loadAll)
        id:                EPINIO_TYPES.ORG,
        type:              'schema',
        collectionMethods: ['POST'],
      },
    ],
  });

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
