import { DSL } from '@/store/type-map';
// import { STATE, NAME as NAME_COL, AGE } from '@/config/table-headers';
import { MANAGEMENT, NORMAN, RBAC } from '@/config/types';
import {
  AGE, GROUP_NAME, GROUP_ROLE_NAME, STATE, USER_DISPLAY_NAME, USER_ID, USER_PROVIDER
} from '@/config/table-headers';
import { USERNAME } from '@/config/cookies';

export const NAME = 'auth';

export function init(store) {
  const {
    product,
    basicType,
    weightType,
    configureType,
    componentForType,
    headers,
    mapType,
    spoofedType,
    virtualType,
  } = DSL(store, NAME);

  product({
    ifHaveType:          MANAGEMENT.USER,
    inStore:             'management',
    icon:                'user',
    removable:           false,
    weight:              50,
    showClusterSwitcher: false,
  });

  virtualType({
    label:       'Auth Provider',
    icon:        'lock',
    namespaced:  false,
    name:        'config',
    weight:      100,
    route:       { name: 'c-cluster-auth-config' },
  });

  spoofedType({
    label:             'Groups',
    type:              NORMAN.SPOOFED.GROUP_PRINCIPAL,
    collectionMethods: [],
    schemas:           [
      {
        id:                NORMAN.SPOOFED.GROUP_PRINCIPAL,
        type:              'schema',
        collectionMethods: [],
        resourceFields:    {},
        // icon:              'lock', // TODO: RC see type-map getTree, allTypes. allTypes does not bring in icon from here... should it?
        // Two types in allTypes... one from schema and one from top level. schema one does not copy of icon. top level is ignored isBasic && !groupForBasicType
      }
    ],
    getInstances: async() => {
      // TODO: RC Q Manually set this
      // const counts = rootGetters[`${module}/all`](COUNT)?.[0]?.counts || {};

      const principals = await store.dispatch('rancher/findAll', {
        type: NORMAN.PRINCIPAL,
        opt:  { url: '/v3/principals' }
      });
      const globalRoleBindings = await store.dispatch('management/findAll', {
        type: RBAC.GLOBAL_ROLE_BINDING,
        opt:  { force: true }
      });

      // Up front fetch all global roles, in stead of individually when needed (results in many duplicated requests)
      await store.dispatch('management/findAll', { type: RBAC.GLOBAL_ROLE });

      // TODO: CHECK Q does this always redraw... and as such recreate (RE refresh group memberships)
      // TODO: RC This returns instances of principal... with availableActions from that. table looks at instances not of type spoofed
      return principals
        .filter(principal => principal.principalType === 'group' &&
           !!globalRoleBindings.find(globalRoleBinding => globalRoleBinding.groupPrincipalName === principal.id)
        )
        .map(principal => ({
          ...principal,
          type: NORMAN.SPOOFED.GROUP_PRINCIPAL
        }));
    }
  });
  configureType(NORMAN.SPOOFED.GROUP_PRINCIPAL, {
    isCreatable: false,
    showAge:     false,
    showState:   false,
    isRemovable: false,
    // location:    null, TODO: RC Is this helpfull??

  });
  mapType(NORMAN.SPOOFED.GROUP_PRINCIPAL, 'Groups'); // TODO: RC i10n
  weightType(NORMAN.SPOOFED.GROUP_PRINCIPAL, -1, true);
  weightType(MANAGEMENT.USER, 100);

  configureType(MANAGEMENT.AUTH_CONFIG, {
    isCreatable: false,
    isRemovable: false,
    showAge:     false,
    location:    null,
  });

  componentForType(`${ MANAGEMENT.AUTH_CONFIG }/github`, 'auth/github');

  basicType([
    'config',
    MANAGEMENT.USER,
    'groups',
    NORMAN.SPOOFED.GROUP_PRINCIPAL
  ]);

  headers(MANAGEMENT.USER, [
    STATE,
    USER_ID,
    USER_DISPLAY_NAME,
    USER_PROVIDER,
    USERNAME,
    AGE
  ]);

  headers(NORMAN.SPOOFED.GROUP_PRINCIPAL, [
    GROUP_NAME,
    GROUP_ROLE_NAME
  ]);

  // ---------------------------  TODO: RC Remove c-cluster-auth-groups page
  // TODO: RC use spoofedType monitoring/logging. Q Should this virtual type extend to a model (table row actions) and custom create/edit page?
  // Can this be done with virtualType / spoofedType?
  virtualType({
    label:       '(Old) Groups', // TODO: RC i10n
    icon:        'lock', // TODO: RC
    namespaced:  false,
    name:        'groups',
    weight:      -1, // TODO: Use weightType on user Q This never moves below users.
    route:       { name: 'c-cluster-auth-groups' },
  });
}
