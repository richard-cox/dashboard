import { AS, MODE, _EDIT, _UNFLAG } from '@/config/query-params';
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
    // TODO: RC These actions are for principals shown in groups view
    return [
      // TODO: RC Edit
      {
        action:  'goToEdit',
        label:   this.t('action.edit'), // TODO: RC 'edit config'
        icon:    'icon icon-edit',
        enabled:  true,
      },
      // TODO: RC Delete (which is not delete group... but remove all bindings from group/s?)
      {
        action:     'unassignGroupRoles',
        // altAction:  'remove',
        // label:      this.t('action.remove'),// TODO: RC
        label:      'Unassign',
        icon:       'icon icon-trash',
        bulkable:   true,
        enabled:    true,
        bulkAction: 'unassignGroupRoles',
      },
      // ...this._standardActions
    ];
  },

  unassignGroupRoles() {
    return (resources = this) => {
      richard.log('unassignGroupRoles', resources);
      // this.$dispatch('promptRemove', resources);
    };
  },
};
