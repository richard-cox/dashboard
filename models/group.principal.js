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
      richard.log('unassignGroupRoles', resources);
      // this.$dispatch('promptRemove', resources);
    };
  },
};
