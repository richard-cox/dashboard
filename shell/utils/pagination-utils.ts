import { PaginationFeature, PaginationSettings, PaginationSettingsStore, PaginationSettingsStores } from '@shell/types/resources/settings';
import {
  NAMESPACE_FILTER_ALL_USER as ALL_USER,
  NAMESPACE_FILTER_ALL as ALL,
  NAMESPACE_FILTER_ALL_SYSTEM as ALL_SYSTEM,
  NAMESPACE_FILTER_NAMESPACED_YES as NAMESPACED_YES,
  NAMESPACE_FILTER_NAMESPACED_NO as NAMESPACED_NO,
  NAMESPACE_FILTER_KINDS,
  NAMESPACE_FILTER_NS_FULL_PREFIX,
  NAMESPACE_FILTER_P_FULL_PREFIX,
} from '@shell/utils/namespace-filter';
import { PaginationArgs, PaginationResourceContext, PaginationParam, PaginationSort } from '@shell/types/store/pagination.types';
import { sameArrayObjects } from '@shell/utils/array';
import { isEqual } from '@shell/utils/object';
import { STEVE_CACHE } from '@shell/store/features';
import { getPerformanceSetting } from '@shell/utils/settings';
import { PAGINATION_SETTINGS_STORE_DEFAULTS } from '@shell/plugins/steve/steve-pagination-utils';
import { MANAGEMENT } from '@shell/config/types';
import { VuexStore } from '@shell/types/store/vuex';
import { IPlugin, ServerSidePaginationExtensionConfig, ServerSidePaginationExtensionPoints } from '@shell/core/types';
import { Plugin } from '@shell/core/plugin';
import { ExtensionManager } from '@shell/types/extension-manager';

/**
 * Helper functions for server side pagination
 */
class PaginationUtils {
  /**
   * In places where we're using paginated features but not in a page... this is what the max results should be
   */
  readonly defaultPageSize = 100000;
  /**
   * When a ns filter isn't one or more projects/namespaces... what are the valid values?
   *
   * This basically blocks 'Not in a Project'.. which would involve a projectsornamespaces param with every ns not in a project.
   */
  readonly validNsProjectFilters = [ALL, ALL_SYSTEM, ALL_USER, ALL_SYSTEM, NAMESPACE_FILTER_KINDS.NAMESPACE, NAMESPACE_FILTER_KINDS.PROJECT, NAMESPACED_YES, NAMESPACED_NO];

  private getSettings({ rootGetters }: any): PaginationSettings {
    const perf = getPerformanceSetting(rootGetters);

    return perf.serverPagination;
  }

  public getStoreSettings(ctx: any): PaginationSettingsStores
  public getStoreSettings(serverPagination: PaginationSettings): PaginationSettingsStores
  public getStoreSettings(arg: any | PaginationSettings): PaginationSettingsStores {
    const serverPagination: PaginationSettings = arg?.rootGetters !== undefined ? this.getSettings(arg) : arg;

    return serverPagination?.useDefaultStores ? this.getStoreDefault() : serverPagination?.stores || this.getStoreDefault();
  }

  public getStoreDefault(): PaginationSettingsStores {
    return PAGINATION_SETTINGS_STORE_DEFAULTS;
  }

  isSteveCacheEnabled({ rootGetters }: any): boolean {
    // We always get Feature flags as part of start up (see `dispatch('features/loadServer')` in loadManagement)
    return rootGetters['features/get']?.(STEVE_CACHE);
  }

  /**
   * Determine if the downstream cluster has vai enabled
   *
   * Almost all the time the downstream cluster vai state will align with upstream (it manages it)
   * ... unless it's harvester then weird things happen
   */
  async isDownstreamSteveCacheEnabled({ dispatch }: any, clusterId: string): Promise<boolean> {
    const url = `/k8s/clusters/${ clusterId }/v1/${ MANAGEMENT.FEATURE }s/${ STEVE_CACHE }`;
    const entry = await dispatch('cluster/request', { url });

    if (entry.status.lockedValue !== null) {
      return entry.status.lockedValue;
    }

    return (entry.spec.value !== null) ? entry.spec.value : entry.status.default;
  }

  a({
    ctx: { rootGetters },
    storeSettings,
    enabledFor
  }: {
    ctx: Partial<VuexStore>,
    storeSettings: PaginationSettingsStore,
    enabledFor: PaginationResourceContext
  }): boolean {
    if (enabledFor.resource?.id === 'catalog.cattle.io.uiplugin') {
      debugger;
    }

    // No pagination setting for target store, not enabled
    if (!storeSettings) {
      return false;
    }

    // Not interested in a resource, so just top level settings are checked
    if (!enabledFor.resource) {
      return true;
    }

    // Store says all resources are enabled
    if (storeSettings.resources.enableAll) {
      return true;
    }

    // given a resource... but no id... invalid
    if (!enabledFor.resource.id) {
      return false;
    }

    // Store says only some (those that have pagination columns not from schema and no custom list)
    const isGeneric =
      !rootGetters['type-map/configuredHeaders'](enabledFor.resource.id) &&
      !rootGetters['type-map/configuredPaginationHeaders'](enabledFor.resource.id) &&
      !rootGetters['type-map/hasCustomList'](enabledFor.resource.id);

    if (storeSettings.resources.enableSome?.generic && isGeneric) {
      return true;
    }

    if (storeSettings.resources.enableSome?.enabled.find((setting) => {
      if (typeof setting === 'string') {
        return setting === enabledFor.resource?.id;
      }

      if (setting.resource === enabledFor.resource?.id) {
        if (!!setting.context) {
          return enabledFor.resource?.context ? setting.context.includes(enabledFor.resource.context) : false;
        }

        return true;
      }

      return false;
    })) {
      return true;
    }

    return false;
  }

  /**
   * Is pagination enabled at a global level or for a specific resource
   */
  isEnabled({ rootGetters, $plugin }: any, enabledFor: PaginationResourceContext) {
    // Cache must be enabled to support pagination api
    if (!this.isSteveCacheEnabled({ rootGetters })) {
      return false;
    }

    const settings = this.getSettings({ rootGetters });

    // No setting, not enabled
    if (!settings) {
      return false;
    }

    // Missing required params, not enabled
    if (!enabledFor) {
      return false;
    }

    const plugin = $plugin as ExtensionManager;
    const extensionSettings = plugin.getAll()[ServerSidePaginationExtensionPoints.RESOURCES];

    if (extensionSettings) {
      const allowed = Object.entries(extensionSettings).find(([extension, settingsFn]) => {
        if (!settingsFn) {
          return false;
        }

        const settings = settingsFn();
        const allowed = Object.entries(settings).find(([store, settingsFn]) => {
          if (store !== enabledFor.store) {
            return false;
          }

          return this.a({
            ctx:           { rootGetters },
            storeSettings: settings,
            enabledFor
          });
        });

        if (allowed) {
          return true;
        }
      });

      if (allowed) {
        return true;
      }
    }

    const storeSettings = this.getStoreSettings(settings)?.[enabledFor.store];

    return this.a({
      ctx: { rootGetters },
      storeSettings,
      enabledFor
    });

    // // No pagination setting for target store, not enabled
    // if (!storeSettings) {
    //   return false;
    // }

    // // Not interested in a resource, so just top level settings are checked
    // if (!enabledFor.resource) {
    //   return true;
    // }

    // // Store says all resources are enabled
    // if (storeSettings.resources.enableAll) {
    //   return true;
    // }

    // // given a resource... but no id... invalid
    // if (!enabledFor.resource.id) {
    //   return false;
    // }

    // // Store says only some (those that have pagination columns not from schema and no custom list)
    // const isGeneric =
    //   !rootGetters['type-map/configuredHeaders'](enabledFor.resource.id) &&
    //   !rootGetters['type-map/configuredPaginationHeaders'](enabledFor.resource.id) &&
    //   !rootGetters['type-map/hasCustomList'](enabledFor.resource.id);

    // if (storeSettings.resources.enableSome.generic && isGeneric) {
    //   return true;
    // }

    // if (storeSettings.resources.enableSome.enabled.find((setting) => {
    //   if (typeof setting === 'string') {
    //     return setting === enabledFor.resource?.id;
    //   }

    //   if (setting.resource === enabledFor.resource?.id) {
    //     if (!!setting.context) {
    //       return enabledFor.resource?.context ? setting.context.includes(enabledFor.resource.context) : false;
    //     }

    //     return true;
    //   }

    //   return false;
    // })) {
    //   return true;
    // }

    // return false;
  }

  listAutoRefreshToggleEnabled({ rootGetters }: any): boolean {
    return this.isFeatureEnabled({ rootGetters }, 'listAutoRefreshToggle');
  }

  isListManualRefreshEnabled({ rootGetters }: any): boolean {
    return this.isFeatureEnabled({ rootGetters }, 'listManualRefresh');
  }

  private isFeatureEnabled({ rootGetters }: any, featureName: PaginationFeature): boolean {
    // Cache must be enabled to support pagination api
    if (!this.isSteveCacheEnabled({ rootGetters })) {
      return false;
    }

    const settings = this.getSettings({ rootGetters });

    return !!settings.features?.[featureName]?.enabled;
  }

  resourceChangesDebounceMs({ rootGetters }: any): number | undefined {
    const settings = this.getSettings({ rootGetters });

    return settings.resourceChangesDebounceMs;
  }

  validateNsProjectFilters(nsProjectFilters: string[]) {
    return nsProjectFilters?.every((f) => this.validateNsProjectFilter(f));
  }

  validateNsProjectFilter(nsProjectFilter: string) {
    if (nsProjectFilter.startsWith(NAMESPACE_FILTER_NS_FULL_PREFIX) || nsProjectFilter.startsWith(NAMESPACE_FILTER_P_FULL_PREFIX)) {
      return true;
    }

    return this.validNsProjectFilters.includes(nsProjectFilter);
  }

  paginationFilterEqual(a: PaginationParam, b: PaginationParam): boolean {
    if (a.param !== b.param || a.equals !== b.equals) {
      return false;
    }

    return sameArrayObjects(a.fields, b.fields, true);
  }

  paginationFiltersEqual(a: PaginationParam[], b: PaginationParam[]): boolean {
    if (!!a && a?.length !== b?.length) {
      return false;
    }

    for (let i = 0; i < a.length; i++) {
      if (!this.paginationFilterEqual(a[i], b[i])) {
        return false;
      }
    }

    return true;
  }

  paginationEqual(a?: PaginationArgs, b?: PaginationArgs): boolean {
    const {
      filters: aFilter = [], sort: aSort = [], projectsOrNamespaces: aPN = [], ...aPrimitiveTypes
    } = a || {};
    const {
      filters: bFilter = [], sort: bSort = [], projectsOrNamespaces: bPN = [], ...bPrimitiveTypes
    } = b || {};

    return isEqual(aPrimitiveTypes, bPrimitiveTypes) &&
      this.paginationFiltersEqual(aFilter, bFilter) &&
      this.paginationFiltersEqual(aPN, bPN) &&
      sameArrayObjects<PaginationSort>(aSort, bSort, true);
  }
}

export default new PaginationUtils();
