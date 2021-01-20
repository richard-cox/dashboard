import { AS, MODE, _EDIT, _UNFLAG } from '@/config/query-params';
import { NORMAN, RBAC } from '@/config/types';
import richard from '@/utils/richards';
import { clone } from '@/utils/object';

export default {

  canViewInApi() {
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

    detailLocation.params.id = this.id; // Base fn removes part of the id (`github_team://3375666` --> `3375666`)

    return detailLocation;
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
        label:      this.t('action.unassign'),
        icon:       'icon icon-trash',
        bulkable:   true,
        enabled:    true,
        bulkAction: 'unassignGroupRoles',
      },
    ];
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
