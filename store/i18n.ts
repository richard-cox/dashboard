import IntlMessageFormat from 'intl-messageformat';
import { LOCALE } from '@/config/cookies';
import { get } from '@/utils/object';
import { getProduct, getVendor } from '@/config/private-label';
import { getterTree, mutationTree, actionTree, useAccessor } from 'nuxt-typed-vuex';
const en = require('~/assets/translations/en-us.yaml');

// @nuxt/typescript-runtime TODO: RC remove?
const translationContext = (require as any).context('@/assets/translations', true, /.*/);

const NONE = 'none';

// Formatters can't be serialized into state
const intlCache = {};

interface State {
  default: 'en-us',
  selected: string,
  previous: null,
  available: any,
  translations: { 'en-us': any },
}

export const state = function() {
  const available = translationContext.keys().map(path => path.replace(/^.*\/([^\/]+)\.[^.]+$/, '$1'));

  const out: State = {
    default:      'en-us',
    selected:     null,
    previous:     null,
    available,
    translations: { 'en-us': en },
  };

  return out;
};

export const getters = getterTree(state, {
  selectedLocaleLabel(state) {
    const key = `locale.${ state.selected }`;

    if ( state.selected === NONE ) {
      return `%${ key }%`;
    } else {
      return get(state.translations[state.default], key);
    }
  },

  availableLocales(state, getters) {
    const out = {};

    for ( const locale of state.available ) {
      const key = `locale.${ locale }`;

      if ( state.selected === NONE ) {
        out[locale] = `%${ key }%`;
      } else {
        out[locale] = get(state.translations[state.default], key);
      }
    }

    return out;
  },

  t: state => (key, args?) => {
    if (state.selected === NONE ) {
      return `%${ key }%`;
    }

    const cacheKey = `${ state.selected }/${ key }`;
    let formatter = intlCache[cacheKey];

    if ( !formatter ) {
      let msg = get(state.translations[state.selected], key);

      if ( !msg ) {
        msg = get(state.translations[state.default], key);
      }

      if ( !msg ) {
        return undefined;
      }

      if ( typeof msg === 'object' ) {
        console.error('Translation for', cacheKey, 'is an object'); // eslint-disable-line no-console

        return undefined;
      }

      if ( msg?.includes('{')) {
        formatter = new IntlMessageFormat(msg, state.selected);
      } else {
        formatter = msg;
      }

      intlCache[cacheKey] = formatter;
    }

    if ( typeof formatter === 'string' ) {
      return formatter;
    } else if ( formatter && formatter.format ) {
      // Inject things like appName so they're always available in any translation
      const moreArgs = {
        vendor:  getVendor(),
        appName: getProduct(),
        ...args
      };

      return formatter.format(moreArgs);
    } else {
      return '?';
    }
  },

  exists: state => (key) => {
    const cacheKey = `${ state.selected }/${ key }`;

    if ( intlCache[cacheKey] ) {
      return true;
    }

    let msg = get(state.translations[state.default], key);

    if ( !msg && state.selected && state.selected !== NONE ) {
      msg = get(state.translations[state.selected], key);
    }

    if ( msg !== undefined ) {
      return true;
    }

    return false;
  },

  withFallback: (state, getters) => (key, args, fallback) => {
    if ( !fallback ) {
      fallback = args;
      args = {};
    }

    if ( getters.exists(key) ) {
      return getters.t(key, args);
    } else {
      return fallback;
    }
  }
});

export const mutations = mutationTree(state, {
  loadTranslations(state, { locale, translations }) {
    state.translations[locale] = translations;
  },

  setSelected(state, locale) {
    state.selected = locale;
  },
});

export const actions = actionTree(
  {
    state, getters, mutations
  },
  {
    // NOTE - Must have a return type to avoid below error in vue-shim
    // `'$accessor' is referenced directly or indirectly in its own type annotation`
    init({ state }): Promise<void> {
      let selected = null;// this.$cookies.get(LOCALE, { parseJSON: false }); // TODO: RC

      if ( !selected ) {
        selected = state.default;
      }

      return this.app.$accessor.i18n.switchTo(selected);
    },

    async load({ commit }, locale) {
      const translations = await translationContext(`./${ locale }.yaml`);

      // this is typed!
      commit('loadTranslations', { locale, translations });

      return true;
    },

    async switchTo({ state, commit, dispatch }, locale) {
      if ( locale === NONE ) {
        commit('setSelected', locale);

        // Don't remember into cookie
        return;
      }

      if ( !state.translations[locale] ) {
        try {
          await dispatch('load', locale);
        } catch (e) {
          if ( locale !== 'en-us' ) {
          // Try to show something...

            commit('setSelected', 'en-us');

            return;
          }
        }
      }

      commit('setSelected', locale);
    // TODO: RC
    // this.$cookies.set(LOCALE, locale, {
    //   encode: x => x,
    //   maxAge: 86400 * 365,
    //   secure: true,
    //   path:   '/',
    // });
    },

    toggleNone({ state, dispatch }) {
      if ( state.selected === NONE ) {
        return dispatch('switchTo', state.previous || state.default);
      } else {
        return dispatch('switchTo', NONE);
      }
    }
  });
