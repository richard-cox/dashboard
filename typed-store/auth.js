import { randomStr } from '@/utils/string';
import { parse as parseUrl, removeParam, addParams } from '@/utils/url';
import { findBy, addObjects } from '@/utils/array';
import { openAuthPopup, returnTo } from '@/utils/auth';
import { GITHUB_SCOPE, GITHUB_NONCE, GITHUB_REDIRECT } from '@/config/query-params';

export const BASE_SCOPES = {
  github: ['read:org'], googleoauth: ['openid profile email'], azuread: []
};

const KEY = 'rc_nonce';

const ERR_NONCE = 'nonce';
const ERR_CLIENT = 'client';
const ERR_SERVER = 'server';

export const state = function() {
  return {
    hasAuth:     null,
    loggedIn:    false,
    principalId: null,
  };
};

export const getters = {
  enabled(state) {
    return state.hasAuth;
  },

  loggedIn(state) {
    return state.loggedIn;
  },

  principalId(state) {
    return state.principalId;
  },

  isGithub(state) {
    return state.principalId && state.principalId.startsWith('github_user://');
  }
};

export const mutations = {
  hasAuth(state, hasAuth) {
    state.hasAuth = !!hasAuth;
  },

  loggedInAs(state, principalId) {
    state.loggedIn = true;
    state.principalId = principalId;

    this.$cookies.remove(KEY);
  },

  loggedOut(state) {
    // Note: plugin/norman/index watches for this mutation
    // to automatically disconnect subscribe sockets.

    state.loggedIn = false;
    state.principalId = null;
  },
};

export const actions = {
  getAuthProviders({ dispatch }) {
    return dispatch('rancher/findAll', {
      type: 'authProvider',
      opt:  { url: `/v3-public/authProviders`, watch: false }
    }, { root: true });
  },

  getAuthConfigs({ dispatch }) {
    return dispatch('rancher/findAll', {
      type: 'authConfig',
      opt:  { url: `/v3/authConfigs` }
    }, { root: true });
  },

  async getAuthProvider({ dispatch }, id) {
    const authProviders = await dispatch('getAuthProviders');

    return findBy(authProviders, 'id', id);
  },

  async getAuthConfig({ dispatch }, id) {
    const authConfigs = await dispatch('getAuthConfigs');

    return findBy(authConfigs, 'id', id);
  },

  setNonce({ dispatch }, opt) {
    let nonce = randomStr(16);

    if ( opt.test ) {
      nonce += '-test';
    }

    if (opt.provider) {
      nonce += `-${ opt.provider }`;
    }
    this.$cookies.set(KEY, nonce, {
      path:     '/',
      sameSite: false,
      secure:   true,
    });

    return nonce;
  },

  async redirectTo({ state, commit, dispatch }, opt = {}) {
    const provider = opt.provider;
    let redirectUrl = opt.redirectUrl;

    if ( !redirectUrl ) {
      const driver = await dispatch('getAuthProvider', provider);

      redirectUrl = driver.redirectUrl;
    }

    if (provider === 'azuread') {
      const params = { response_type: 'code', response_mode: 'query' };

      redirectUrl = addParams(redirectUrl, params );
    }

    const nonce = await dispatch('setNonce', opt);

    const returnToUrl = returnTo(opt, this);

    const fromQuery = unescape(parseUrl(redirectUrl).query?.[GITHUB_SCOPE] || '');
    const scopes = fromQuery.split(/[, ]+/).filter(x => !!x);

    if (BASE_SCOPES[provider]) {
      addObjects(scopes, BASE_SCOPES[provider]);
    }

    if ( opt.scopes ) {
      addObjects(scopes, opt.scopes);
    }

    let url = removeParam(redirectUrl, GITHUB_SCOPE);
    const params = {
      [GITHUB_SCOPE]:    scopes.join(','),
      [GITHUB_NONCE]:    nonce
    };

    if (!url.includes(GITHUB_REDIRECT)) {
      params[GITHUB_REDIRECT] = returnToUrl;
    }

    url = addParams(url, params);

    if ( opt.redirect === false ) {
      return url;
    } else {
      window.location.href = url;
    }
  },

  verifyOAuth({ dispatch }, { nonce, code, provider }) {
    const expect = this.$cookies.get(KEY, { parseJSON: false });

    if ( !expect || expect !== nonce ) {
      return ERR_NONCE;
    }

    return dispatch('login', {
      provider,
      body: { code }
    });
  },

  async test({ dispatch }, { provider, body }) {
    const driver = await dispatch('getAuthConfig', provider);

    try {
      // saml providers
      if (!!driver?.actions?.testAndEnable) {
        const finalRedirectUrl = returnTo({ config: provider }, this);

        const res = await driver.doAction('testAndEnable', { finalRedirectUrl });

        const { idpRedirectUrl } = res;

        return openAuthPopup(idpRedirectUrl, provider);
      } else {
      // github, google, azuread
        const res = await driver.doAction('configureTest', body);
        const { redirectUrl } = res;

        const url = await dispatch('redirectTo', {
          provider,
          redirectUrl,
          test:        true,
          redirect:    false
        });

        return openAuthPopup(url, provider);
      }
    } catch (err) {
      return Promise.reject(err);
    }
  },

  async login({ dispatch }, { provider, body }) {
    const driver = await dispatch('getAuthProvider', provider);

    try {
      const res = await driver.doAction('login', {
        description:  'UI session',
        responseType: 'cookie',
        ...body
      }, { redirectUnauthorized: false });

      return res;
    } catch (err) {
      if ( err._status >= 400 && err._status <= 499 ) {
        return Promise.reject(ERR_CLIENT);
      }

      return Promise.reject(ERR_SERVER);
    }
  },

  async logout({ dispatch, commit }) {
    try {
      await dispatch('rancher/request', {
        url:                  '/v3/tokens?action=logout',
        method:               'post',
        data:                 {},
        headers:              { 'Content-Type': 'application/json' },
        redirectUnauthorized: false,
      }, { root: true });
    } catch (e) {
    }

    commit('loggedOut');
    dispatch('onLogout', null, { root: true });
  }
};

export default {
  state,
  getters,
  mutations,
  actions,
  namespaced: true
};
