import Identicon from 'identicon.js';
import { md5 } from '@/utils/crypto';
import { addParam } from '@/utils/url';
import { ucFirst } from '@/utils/string';

export default {
  avatarSrc() {
    if ( this.provider === 'github' ) {
      return addParam(this.profilePicture, 's', 80); // Double the size it will be rendered, for @2x displays
    } else {
      let id = this.id || 'Unknown';

      id = id.replace(/[^:]+:\/\//, '');

      const hash = md5(id, 'hex');
      const out = `data:image/png;base64,${ new Identicon(hash, 80, 0.01).toString() }`;

      return out;
    }
  },

  roundAvatar() {
    return this.provider === 'github';
  },

  providerSpecificType() {
    const parts = this.id.replace(/:.*$/, '').split('_', 2);

    if ( parts.length === 2 ) {
      return parts[1];
    }

    return null;
  },

  displayType() {
    const provider = this.$rootGetters['i18n/withFallback'](`model.authConfig.provider."${ this.provider }"`, null, this.provider);

    return `${ provider } ${ ucFirst(this.providerSpecificType) }`;
  },

  availableActions() {
    // TODO: RC These actions are for principals shown in groups view
    return [
      // TODO: RC Edit
      {
        action:  this.canUpdate ? 'goToEdit' : 'goToViewConfig',
        label:   this.t(this.canUpdate ? 'action.edit' : 'action.view'),
        icon:    'icon icon-edit',
        enabled:  this.canCustomEdit,
      },
      // TODO: RC Delete (which is not delete group... but remove all bindings from group/s?)
      {
        action:     'unassignGroupRoles',
        // altAction:  'remove',
        label:      this.t('action.remove'),
        icon:       'icon icon-trash',
        bulkable:   true,
        enabled:    true,
        bulkAction: 'unassignGroupRoles',
      },
      ...this._standardActions
    ];
  },

  unassignGroupRoles() {
    return (resources = this) => {
      // this.$dispatch('promptRemove', resources);
    };
  },
};
