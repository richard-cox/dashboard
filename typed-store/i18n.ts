import IntlMessageFormat from 'intl-messageformat';
// import { LOCALE } from '@/config/cookies';
import { get } from '@/utils/object';
import en from '@/assets/translations/en-us.yaml';
import { getProduct, getVendor } from '@/config/private-label';
import { Module, VuexModule, Mutation, Action } from 'vuex-module-decorators';
// import Vuex from 'vuex';
// import store from '@/store';

// @nuxt/typescript-runtime TODO: RC remove?
const translationContext = (require as any).context('@/assets/translations', true, /.*/);

const NONE = 'none';

// Formatters can't be serialized into state
const intlCache = {};

// export const store = new Vuex.Store<any>({});

// dynamic: true,
// store: window.$nuxt.$store
// dynamic: true,
// store,

@Module({
  name: 'i18n',
  stateFactory: true,
  namespaced: true,
})
export default class i18n extends VuexModule {
  // wheels = 2

  // @Mutation
  // incrWheels(extra) {
  //   this.wheels += extra;
  // }

  // get axles() {
  //   return this.wheels / 2;
  // }

  default: string = 'en-us';
  selected: any = null;
  previous: any = null;
  available: any = translationContext.keys().map(path => path.replace(/^.*\/([^\/]+)\.[^.]+$/, '$1'));
  translations = { 'en-us': en };

  // Getters

  get selectedLocaleLabel() {
    console.log('selectedLocaleLabel: this.state', this.state);
    const key = `locale.${ this.selected }`;

    if ( this.selected === NONE ) {
      return `%${ key }%`;
    } else {
      return get(this.translations[this.default], key);
    }
  }

  get availableLocales() {
    const out = {};

    for ( const locale of this.available ) {
      const key = `locale.${ locale }`;

      if ( this.selected === NONE ) {
        out[locale] = `%${ key }%`;
      } else {
        out[locale] = get(this.translations[this.default], key);
      }
    }

    return out;
  }

  get t() {
    return (key, args) => {
      if (this.selected === NONE ) {
        return `%${ key }%`;
      }

      const cacheKey = `${ this.selected }/${ key }`;
      let formatter = intlCache[cacheKey];

      if ( !formatter ) {
        let msg = get(this.translations[this.selected], key);

        if ( !msg ) {
          msg = get(this.translations[this.default], key);
        }

        if ( !msg ) {
          return undefined;
        }

        if ( typeof msg === 'object' ) {
          console.error('Translation for', cacheKey, 'is an object'); // eslint-disable-line no-console

          return undefined;
        }

        if ( msg?.includes('{')) {
          formatter = new IntlMessageFormat(msg, this.selected);
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
    };
  }

  get exists() {
    return (key) => {
      const cacheKey = `${ this.selected }/${ key }`;

      if ( intlCache[cacheKey] ) {
        return true;
      }

      let msg = get(this.translations[this.default], key);

      if ( !msg && this.selected && this.selected !== NONE ) {
        msg = get(this.translations[this.selected], key);
      }

      if ( msg !== undefined ) {
        return true;
      }

      return false;
    };
  }

  get withFallback() {
    return (key, args, fallback) => {
      if ( !fallback ) {
        fallback = args;
        args = {};
      }

      if ( this.exists(key) ) {
        return this.t(key, args);
      } else {
        return fallback;
      }
    };
  }

  // mutations

  @Mutation
  loadTranslations(locale, translations) {
    this.translations[locale] = translations;
  }

  @Mutation
  setSelected(locale) {
    this.selected = locale;
  }

  // actions

  @Action({ rawError: true })
  init() {
    // let selected = this.$cookies.get(LOCALE, { parseJSON: false });// TODO: RC how to access cookies?
    let selected;

    if ( !selected ) {
      // selected = this.context.getters.default;
    }

    return this.context.commit('switchTo', selected);
  }

  // @Action
  // async load(locale) {
  //   const translations = await translationContext(`./${ locale }.yaml`);

  //   this.context.commit('loadTranslations', { locale, translations });

  //   return true;
  // }

  // async switchTo(locale) {
  //   if ( locale === NONE ) {
  //     this.context.commit('setSelected', locale);

  //     // Don't remember into cookie
  //     return;
  //   }

  //   if ( !this.translations[locale] ) {
  //     try {
  //       await this.context.commit('load', locale);
  //     } catch (e) {
  //       if ( locale !== 'en-us' ) {
  //         // Try to show something...

  //         this.context.commit('setSelected', 'en-us');

  //         return;
  //       }
  //     }
  //   }

  //   this.context.commit('setSelected', locale);
  //   // TODO: RC how to access $cookies
  //   // this.$cookies.set(LOCALE, locale, {
  //   //   encode: x => x,
  //   //   maxAge: 86400 * 365,
  //   //   secure: true,
  //   //   path:   '/',
  //   // });
  // }

  // toggleNone() {
  //   if ( this.selected === NONE ) {
  //     return this.context.commit('this.previous || this.default');
  //   } else {
  //     return this.context.commit('NONE');
  //   }
  // }
}

// export const state = function() {
//   const available = translationContext.keys().map(path => path.replace(/^.*\/([^\/]+)\.[^.]+$/, '$1'));

//   const out = {
//     default:      'en-us',
//     selected:     null,
//     previous:     null,
//     available,
//     translations: { 'en-us': en },
//   };

//   return out;
// };

// export const getters = {
//   selectedLocaleLabel(state) {
//     const key = `locale.${ state.selected }`;

//     if ( state.selected === NONE ) {
//       return `%${ key }%`;
//     } else {
//       return get(state.translations[state.default], key);
//     }
//   },

//   availableLocales(state, getters) {
//     const out = {};

//     for ( const locale of state.available ) {
//       const key = `locale.${ locale }`;

//       if ( state.selected === NONE ) {
//         out[locale] = `%${ key }%`;
//       } else {
//         out[locale] = get(state.translations[state.default], key);
//       }
//     }

//     return out;
//   },

//   t: state => (key, args) => {
//     if (state.selected === NONE ) {
//       return `%${ key }%`;
//     }

//     const cacheKey = `${ state.selected }/${ key }`;
//     let formatter = intlCache[cacheKey];

//     if ( !formatter ) {
//       let msg = get(state.translations[state.selected], key);

//       if ( !msg ) {
//         msg = get(state.translations[state.default], key);
//       }

//       if ( !msg ) {
//         return undefined;
//       }

//       if ( typeof msg === 'object' ) {
//         console.error('Translation for', cacheKey, 'is an object'); // eslint-disable-line no-console

//         return undefined;
//       }

//       if ( msg?.includes('{')) {
//         formatter = new IntlMessageFormat(msg, state.selected);
//       } else {
//         formatter = msg;
//       }

//       intlCache[cacheKey] = formatter;
//     }

//     if ( typeof formatter === 'string' ) {
//       return formatter;
//     } else if ( formatter && formatter.format ) {
//       // Inject things like appName so they're always available in any translation
//       const moreArgs = {
//         vendor:  getVendor(),
//         appName: getProduct(),
//         ...args
//       };

//       return formatter.format(moreArgs);
//     } else {
//       return '?';
//     }
//   },

//   exists: state => (key) => {
//     const cacheKey = `${ state.selected }/${ key }`;

//     if ( intlCache[cacheKey] ) {
//       return true;
//     }

//     let msg = get(state.translations[state.default], key);

//     if ( !msg && state.selected && state.selected !== NONE ) {
//       msg = get(state.translations[state.selected], key);
//     }

//     if ( msg !== undefined ) {
//       return true;
//     }

//     return false;
//   },

//   withFallback: (state, getters) => (key, args, fallback) => {
//     if ( !fallback ) {
//       fallback = args;
//       args = {};
//     }

//     if ( getters.exists(key) ) {
//       return getters.t(key, args);
//     } else {
//       return fallback;
//     }
//   }
// };

// export const mutations = {
//   loadTranslations(state, { locale, translations }) {
//     state.translations[locale] = translations;
//   },

//   setSelected(state, locale) {
//     state.selected = locale;
//   },
// };

// export const actions = {
//   init({ state, commit, dispatch }) {
//     let selected = this.$cookies.get(LOCALE, { parseJSON: false });

//     if ( !selected ) {
//       selected = state.default;
//     }

//     return dispatch('switchTo', selected);
//   },

//   async load({ commit }, locale) {
//     const translations = await translationContext(`./${ locale }.yaml`);

//     commit('loadTranslations', { locale, translations });

//     return true;
//   },

//   async switchTo({ state, commit, dispatch }, locale) {
//     if ( locale === NONE ) {
//       commit('setSelected', locale);

//       // Don't remember into cookie
//       return;
//     }

//     if ( !state.translations[locale] ) {
//       try {
//         await dispatch('load', locale);
//       } catch (e) {
//         if ( locale !== 'en-us' ) {
//           // Try to show something...

//           commit('setSelected', 'en-us');

//           return;
//         }
//       }
//     }

//     commit('setSelected', locale);
//     this.$cookies.set(LOCALE, locale, {
//       encode: x => x,
//       maxAge: 86400 * 365,
//       secure: true,
//       path:   '/',
//     });
//   },

//   toggleNone({ state, dispatch }) {
//     if ( state.selected === NONE ) {
//       return dispatch('switchTo', state.previous || state.default);
//     } else {
//       return dispatch('switchTo', NONE);
//     }
//   }
// };
