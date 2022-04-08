import { RouteConfig } from 'vue-router';

// package.json metadata
export interface PackageMetadata {
  name: string;
  version: string;
  description: string;
  icon: string;
}

// export interface Route {
//   name: string;
//   path: string;
//   component: Object | Function,
//   children: Route[];
// }

export type VuexStoreObject = { [key: string]: any }
export type CoreStoreSpecifics = { state: () => VuexStoreObject, getters: VuexStoreObject, mutations: VuexStoreObject, actions: VuexStoreObject }
export type CoreStoreConfig = { namespace: string, baseUrl?: string, modelBaseClass?: string, supportsStream?: boolean, isClusterStore?: boolean }
export type RegisterStore = () => (store: any) => void

export type OnEnterLeavePackageConfig = {
  clusterId: string,
  product: string,
  oldProduct: string,
  isExt: string,
  oldIsExt: string
}
export type OnEnterPackage = (store: any, config: OnEnterLeavePackageConfig) => Promise<void>;
export type OnLeavePackage = (store: any, config: OnEnterLeavePackageConfig) => Promise<void>;

/**
 * Interface for a Dashboard plugin
 */
export interface IPlugin {
  /**
   * Add a product
   * @param importFn Function that will import the module containing a product definition
   */
  addProduct(importFn: Function): void;

  /**
   * Add a locale to the i18n store
   * @param locale Locale id (e.g. en-us)
   * @param label Label for the locale to be displayed in the i18n chooser
   */
  addLocale(locale: string, label: string): void;

  /**
   * Plugin metadata
   */
  metadata: PackageMetadata;

  /**
   * TODO: RC
   */
  addI18n(locale: string, fn: Function): void;

  /**
   * Add a route to the Vue Router
   */
  addRoute(route: RouteConfig): void;
  addRoute(parent: string, route: RouteConfig): void;

   /**
    * Add a hook to be called when the plugin is uninstalled
    * @param hook Function to call when the plugin is uninstalled
    */
  addUninstallHook(hook: Function): void;

  /**
   * Add a generic Vuex Store
   */
  addStore(storeName: string, register: RegisterStore): void;
  /**
   * Add a Vuex `Core`. This will be automatically populated with required getters/mutations/actions to support Dashboard components
   *
   * The core store should container override getters/mutations/actions (in storeSpecifics) that executes plugin specific code, for instead
   * to exercise the `requests` action to make plugin specific https requests
   */
  addCoreStore(storeName: string, storeSpecifics: CoreStoreSpecifics, config: CoreStoreConfig): void;

  /**
   * TODO: RC
   */
  addOnEnterLeaveHooks(onEnter: OnEnterPackage, onLeave: OnLeavePackage): void
}
