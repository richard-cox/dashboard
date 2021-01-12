import { DSL } from '@/store/type-map';
// import { STATE, NAME as NAME_COL, AGE } from '@/config/table-headers';
import { MANAGEMENT, NORMAN } from '@/config/types';
import {
  AGE, GROUP_NAME, GROUP_ROLE_NAME, STATE, USER_DISPLAY_NAME, USER_ID, USER_PROVIDER, NAME as NAME_COL
} from '@/config/table-headers';
import { USERNAME } from '@/config/cookies';

export const NAME = 'auth';

export function init(store) {
  const {
    product,
    basicType,
    // weightType,
    configureType,
    componentForType,
    headers,
    // mapType,
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

  // TODO: RC Q Should this virtual type extend to a model (table row actions) and custom create/edit page?
  virtualType({
    label:       'Groups', // TODO: RC i10n
    icon:        'lock', // TODO: RC
    namespaced:  false,
    name:        'groups',
    weight:      0, // TODO: Q This never moves below users
    count:       12345, // TODO: RC Q Should the groups table show all groups/principles?
    route:       { name: 'c-cluster-auth-groups' },
  });

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
    'groups' // TODO: RC Q Conditionally add given providers. Just show warning at top (like that in assign roles)?
  ]);

  // TODO: RC Q Should this be here?
  headers(MANAGEMENT.USER, [
    STATE,
    USER_ID,
    USER_DISPLAY_NAME,
    USER_PROVIDER,
    USERNAME,
    AGE
  ]);

  // TODO: RC Q Should this be here?
  headers(NORMAN.PRINCIPAL, [
    GROUP_NAME,
    GROUP_ROLE_NAME
  ]);
}
