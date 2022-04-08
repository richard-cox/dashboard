import { RouteConfig } from 'vue-router';
import { DSL as STORE_DSL } from '@shell/store/type-map';
import { IPlugin } from './types';
import coreStore, { coreStoreModule, coreStoreState } from '@/shell/plugins/core-store';
import { RegisterStore, CoreStoreSpecifics, CoreStoreConfig } from '@/shell/core/types';

export class Plugin implements IPlugin {
  public id: string;
  public name: string;
  public types: any = {};
  public i18n: { [key: string]: Function[] } = {};
  public locales: { locale: string, label: string}[] = [];
  public products: Function[] = [];
  public productNames: string[] = [];
  public routes: { parent?: string, route: RouteConfig }[] = [];
  public stores: { storeName: string, register: RegisterStore }[] = [];

  // Plugin metadata (plugin package.json)
  public _metadata: any = {};

  // Is this a built-in plugin (bundled with the application)
  public builtin = false;

  // Uninstall hooks
  public uninstallHooks: Function[] = [];

  constructor(id: string) {
    this.id = id;
    this.name = id;
  }

  get metadata() {
    return this._metadata;
  }

  set metadata(value) {
    this._metadata = value;
    this.name = this._metadata.name || this.id;
  }

  // Track which products the plugin creates
  DSL(store: any, productName: string) {
    const storeDSL = STORE_DSL(store, productName);

    this.productNames.push(productName);

    return storeDSL;
  }

  addProduct(product: Function): void {
    this.products.push(product);
  }

  addLocale(locale: string, label: string): void {
    this.locales.push({ locale, label });
  }

  addI18n(locale: string, fn: Function) {
    this.register('i18n', locale, fn);
  }

  addRoute(parentOrRoute: any, route?: any): void {
    // TODO: RC add
    if (typeof (parentOrRoute) === 'string') {
      this.routes.push({ parent: parentOrRoute as string, route });
    } else {
      this.routes.push({ route: parentOrRoute as RouteConfig });
    }
  }

  addUninstallHook(hook: Function) {
    this.uninstallHooks.push(hook);
  }

  addStore(storeName: string, register: RegisterStore) {
    this.stores.push({ storeName, register });
  }

  addCoreStore(storeName: string, storeSpecifics: CoreStoreSpecifics, config: CoreStoreConfig) {
    this.stores.push({
      storeName,
      register: () => {
        return coreStore(
          this.storeFactory(storeSpecifics, config),
          config,
        );
      }
    });
  }

  private storeFactory(storeSpecifics: CoreStoreSpecifics, config: CoreStoreConfig) {
    return {
      ...coreStoreModule,

      state() {
        return {
          ...coreStoreState(config.namespace, config.baseUrl),
          ...storeSpecifics.state()
        };
      },

      getters: {
        ...coreStoreModule.getters,
        ...storeSpecifics.getters
      },

      mutations: {
        ...coreStoreModule.mutations,
        ...storeSpecifics.mutations
      },

      actions: {
        ...coreStoreModule.actions,
        ...storeSpecifics.actions
      },
    };
  }

  private register(type: string, name: string, fn: Function) {
    // Accumulate i18n resources rather than replace
    if (type === 'i18n') {
      if (!this.i18n[name]) {
        this.i18n[name] = [];
      }

      this.i18n[name].push(fn);
    } else {
      if (!this.types[type]) {
        this.types[type] = {};
      }
      this.types[type][name] = fn;
    }
  }
}
