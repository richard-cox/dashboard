import { AS, MODE, _EDIT, _UNFLAG } from '@/config/query-params';
import { NORMAN, RBAC } from '@/config/types';
import richard from '@/utils/richards';
import { clone } from '@/utils/object';

export default {

  canViewInApi() {
    richard.log('canViewInApi!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');

    return false;
  },

  nameDisplay() {
    return this.principalNameDisplay;
  },

  principalNameDisplay() {
    const principal = this.$rootGetters['rancher/byId'](NORMAN.PRINCIPAL, this.id);

    return `${ principal.name } (${ principal.displayType })`;
  },

  detailLocation() {
    const detailLocation = clone(this._detailLocation);

    richard.log('detailLocation BEFORE', detailLocation.params.id);
    detailLocation.params.id = this.id; // Base fn removes part of the id (`github_team://3375666` --> `3375666`)
    richard.log('detailLocation AFTER', detailLocation.params.id);

    return detailLocation;

    // return {
    //   path: `/c/local/auth/group.principal/assign-edit?principal=${ this.id }`
    //   // name:   `c-cluster-product-resource${ schema?.attributes?.namespaced ? '-namespace' : '' }-id`,
    //   // params: {
    //   //   product:   'auth',
    //   //   cluster:   this.$rootGetters['clusterId'],
    //   // }
    // };
  },

  // goToEdit() {
  //   return (moreQuery = {}) => {
  //     richard.log('moreQuery: ', moreQuery);
  //     const location = this.detailLocation;

  //     location.query = {
  //       ...location.query,
  //       [MODE]: _EDIT,
  //       [AS]:   _UNFLAG,
  //       ...moreQuery
  //     };

  //     this.currentRouter().push(location);
  //   };
  // },

  availableActions() {
    return [
      {
        action:  'goToViewConfig',
        label:   this.t('action.view'),
        icon:    'icon icon-edit',
        enabled:  this.canCustomEdit,
      },
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

  // validationErrors() // TODO: RC?

  // TODO: RC Assign this to action?? use in save??
  roleBindings() {
    return !!this.$getters['all'](RBAC.GLOBAL_ROLE_BINDING)
      .filter(globalRoleBinding => this.id === globalRoleBinding.groupPrincipalName);
  },

  unassignGroupRoles() {
    // TODO: RC terminology.... promptRemove is 'Delete'
    return (resources = this) => {
      const principals = Array.isArray(resources) ? resources : [resources];

      const globalRoleBindings = this.$getters['all'](RBAC.GLOBAL_ROLE_BINDING)
        .filter(globalRoleBinding => principals.find(principal => principal.id === globalRoleBinding.groupPrincipalName));

      richard.log('unassignGroupRoles', globalRoleBindings);
      this.$dispatch('promptRemove', globalRoleBindings);
    };
  },
};
