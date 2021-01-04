import { insertAt } from '@/utils/array';

const configType = {
  activedirectory: 'ldap',
  azuread:         'oauth',
  openldap:        'ldap',
  freeipa:         'ldap',
  ping:            'saml',
  adfs:            'saml',
  keycloak:        'saml',
  okta:            'saml',
  shibboleth:      'saml',
  googleoauth:     'oauth',
  local:           '',
  github:          'oauth',
};

export default {
  _availableActions() {
    const out = this._standardActions;

    insertAt(out, 0, {
      action:     'disable',
      label:      'Disable',
      icon:       'icon icon-spinner',
      enabled:    this.enabled === true,
    });

    insertAt(out, 1, { divider: true });

    return out;
  },

  nameDisplay() {
    return this.$rootGetters['i18n/withFallback'](`model.authConfig.provider."${ this.id }"`, null, this.id);
  },

  configType() {
    return configType[this.id];
  },

  sideLabel() {
    return this.$rootGetters['i18n/withFallback'](`model.authConfig.description."${ this.configType }"`, null, this.configType);
  },

  icon() {
    return require(`~/assets/images/vendor/${ this.id }.svg`);
  },

  state() {
    if ( this.enabled ) {
      return 'active';
    }

    return 'inactive';
  },

  disable() {
    return async() => {
      this.enabled = false;
      await this.save();
      this.currentRouter().push({ name: 'c-cluster-auth-config' });
    };
  }
};
