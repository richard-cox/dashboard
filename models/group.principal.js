import { AS, MODE, _EDIT, _UNFLAG } from '@/config/query-params';
import { RBAC } from '@/config/types';
import richard from '@/utils/richards';

export default {

  canViewInApi() {
    richard.log('canViewInApi!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');

    return false;
  },

  detailLocation() {
    richard.log(this.id, this.id?.replace(/.*\//, ''));

    return {
      path: `/c/local/auth/group.principal/assign-edit?principal=${ this.id }`
      // name:   `c-cluster-product-resource${ schema?.attributes?.namespaced ? '-namespace' : '' }-id`,
      // params: {
      //   product:   'auth',
      //   cluster:   this.$rootGetters['clusterId'],
      // }
    };
  },

  goToEdit() {
    return (moreQuery = {}) => {
      richard.log('moreQuery: ', moreQuery);
      const location = this.detailLocation;

      location.query = {
        ...location.query,
        [MODE]: _EDIT,
        [AS]:   _UNFLAG,
        ...moreQuery
      };

      this.currentRouter().push(location);
    };
  },

  availableActions() {
    return [
      {
        action:  'goToEdit',
        label:   this.t('action.edit'),
        icon:    'icon icon-edit',
        enabled:  true,
      },
      {
        action:     'unassignGroupRoles',
        label:      this.t('action.unassign'), // TODO: RC This shows up as 'Edit Config'
        icon:       'icon icon-trash',
        bulkable:   true,
        enabled:    true,
        bulkAction: 'unassignGroupRoles',
      },
    ];
  },

  unassignGroupRoles() {
    // TODO: RC implement
    // TODO: RC test single, multiple
    return (resources = this) => {
      const principals = Array.isArray(resources) ? resources : [resources];

      debugger;

      // TODO: RC Q Costly....
      const a = this.$getters['all'](RBAC.GLOBAL_ROLE_BINDING);
      const globalRoleBindings = a
        // Bindings for this group
        .filter(globalRoleBinding => principals.find(principal => principal.id === globalRoleBinding.groupPrincipalName));

      richard.log('unassignGroupRoles', globalRoleBindings);
      this.$dispatch('promptRemove', globalRoleBindings);
    };
  },
};
