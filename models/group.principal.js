import { AS, MODE, _EDIT, _UNFLAG } from '@/config/query-params';
import { NORMAN, RBAC } from '@/config/types';
import richard from '@/utils/richards';
import { clone } from '@/utils/object';
import richards from '@/utils/richards';

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
      // {
      //   action:  'refreshGroupMemberships',
      //   label:   this.t('authGroups.actions.refresh'),
      //   icon:    'icon icon-edit',
      //   enabled:  true,
      // },
      // {
      //   action:  'goToGlobalAssign',
      //   label:   this.t('authGroups.actions.assignRoles'),
      //   icon:    'icon icon-edit',
      //   enabled:  true,
      // },
    ];
  },

  unassignGroupRoles() {
    return (resources = this) => {
      const principals = Array.isArray(resources) ? resources : [resources];

      const globalRoleBindings = this.$getters['all'](RBAC.GLOBAL_ROLE_BINDING)
        .filter(globalRoleBinding => principals.find(principal => principal.id === globalRoleBinding.groupPrincipalName));

      this.$dispatch('promptRemove', globalRoleBindings);
    };
  },

  // async refreshGroupMemberships() {
  //   // TODO: RC BUTTONS use async button to show state
  //   try {
  //     // TODO: RC BUTTONS test - See ./ui/lib/global-admin/addon/security/accounts/groups/controller.js
  //     await this.$dispatch('rancher/request', {
  //       url:           '/v3/users?action=refreshauthprovideraccess',
  //       method:        'post',
  //       // headers:       { 'Content-Type': 'application/json' },
  //       data:          { },
  //     });

  //     const spoofed = await this.$dispatch(`rancher/create`, { type: NORMAN.SPOOFED.GROUP_PRINCIPAL });

  //     await spoofed.updateList();

  //     // TODO: RC How does this update the lists associated with this type??
  //   } catch (error) {
  //     this.$dispatch('growl/fromError', { title: 'Error refreshing group memberships', error }, { root: true });
  //   }
  // },

  // goToGlobalAssign() {
  //   this.currentRouter().push({
  //     path:  'group.principal/assign-edit',
  //     query: { [MODE]: _EDIT }
  //   });
  // },

  async updateList() {
    // TODO: RC REFRESH - The below, as per promptRemove... does not work (getInstances is called.. but there's no change in the table)
    // Need to also fix assign-edit & promptRemove use case
    const a = await this.$dispatch('cluster/findAll', {
      type: NORMAN.SPOOFED.GROUP_PRINCIPAL,
      opt:  { force: true } // TODO: RC force honoured?
    }, { root: true });

    richards.log('updated list: ', a);
  }

};
