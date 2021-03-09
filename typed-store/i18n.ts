import IntlMessageFormat from 'intl-messageformat';
// import { LOCALE } from '@/config/cookies';
import { get } from '@/utils/object';
import { getProduct, getVendor } from '@/config/private-label';
import {
  Module, VuexModule, Mutation, Action, getModule
} from 'vuex-module-decorators';
import store from '@/typed-store';
const en = require('@/assets/translations/en-us.yaml');

// @nuxt/typescript-runtime TODO: RC remove?
const translationContext = (require as any).context('@/assets/translations', true, /.*/);

const NONE = 'none';

// Formatters can't be serialized into state
const intlCache = {};

@Module({
  name: 'i18n',
  stateFactory: true,
  namespaced: true,
  dynamic: true,
  store
})
export default class i18n extends VuexModule {
  default: string = 'en-us';
  selected: any = null;
  previous: any = null;
  available: any = translationContext.keys().map(path => path.replace(/^.*\/([^\/]+)\.[^.]+$/, '$1'));
  translations = { 'en-us': en };

  // Getters

  get selectedLocaleLabel() {
    console.log('selectedLocaleLabel: this.selected', this.selected);
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
    return (key, args?) => {
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

    console.error('i18n: init', this.default);
    if ( !selected ) {
      selected = this.default;
    }

    return this.context.dispatch('switchTo', selected);
  }

  @Action
  async load(locale) {
    const translations = await translationContext(`./${ locale }.yaml`);

    this.context.commit('loadTranslations', { locale, translations });

    return true;
  }

  @Action
  async switchTo(locale) {
    console.error('i18nL switchTo', Object.keys(this.context));
    console.error('i18nL switchTo', locale);
    if ( locale === NONE ) {
      this.context.commit('setSelected', locale);

      // Don't remember into cookie
      return;
    }

    if ( !this.translations[locale] ) {
      try {
        await this.context.dispatch('load', locale);
      } catch (e) {
        if ( locale !== 'en-us' ) {
          // Try to show something...

          this.context.commit('setSelected', 'en-us');

          return;
        }
      }
    }

    this.context.commit('setSelected', locale);
    // TODO: RC how to access $cookies
    // this.$cookies.set(LOCALE, locale, {
    //   encode: x => x,
    //   maxAge: 86400 * 365,
    //   secure: true,selectedLocaleLabel
    //   path:   '/',
    // });
  }

  @Action
  toggleNone() {
    if ( this.selected === NONE ) {
      return this.context.dispatch(this.previous || this.default);
    } else {
      return this.context.dispatch('NONE');
    }
  }
}
