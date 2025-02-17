import paginationUtils from '@shell/utils/pagination-utils';
import { PaginationArgs, PaginationResourceContext, StorePagination } from '@shell/types/store/pagination.types';
import { VuexStore } from '@shell/types/store/vuex';
import { ActionFindPageArgs } from '@shell/types/store/dashboard-store.types';
import {
  STEVE_WATCH_EVENT_LISTENER_CALLBACK, STEVE_UNWATCH_EVENT_PARAMS, STEVE_WATCH_EVENT, STEVE_WATCH_EVENT_PARAMS, STEVE_WATCH_EVENT_PARAMS_COMMON, STEVE_WATCH_MODE, STEVE_WATCH_PARAMS
} from '@shell/types/store/subscribe.types';

interface Args {
  $store: VuexStore,
  /**
   * Unique ID for this request. Used for watch purposes
   */
  id: string,
  /**
   * Args used when determining if this resource type supports SSP
   */
  enabledFor: PaginationResourceContext,
  /**
   * Callback called when the resource is changed (notified by socket)
   */
  onChange?: () => void,
  /**
   * Convert the response into a model class instance
   */
  classify?: boolean,
}

/**
 * This is a helper class that will assist in fetching a resource via the new Server-Side Pagination API
 *
 * This is designed to work in places where we don't/can't store the resource in the store
 * - There already exists a resource we don't want to overwrite
 * - We're transient and want something nicer than just `cluster/request` + all the trimmings
 *
 * It ...
 * - Handles if the resource can be fetched by the new pagination api
 * - Makes a request to get a page (including classify)
 * - Provide updates when the resource changes
 */
class PaginationWrapper<T = any> {
  private $store: VuexStore;
  private enabledFor: PaginationResourceContext;
  private onChange?: STEVE_WATCH_EVENT_LISTENER_CALLBACK;
  private id: string;
  private classify: boolean;

  public isEnabled: boolean;
  private steveWatchParams: STEVE_WATCH_EVENT_PARAMS_COMMON | undefined;

  constructor(args: Args) {
    const {
      $store, id, enabledFor, onChange, classify
    } = args;

    this.$store = $store;
    this.id = id;
    this.enabledFor = enabledFor;
    this.onChange = onChange;
    this.classify = classify || false;

    this.isEnabled = paginationUtils.isEnabled({ rootGetters: $store.getters }, enabledFor);
  }

  async request(args: {
      pagination: PaginationArgs,
  }): Promise<T[]> {
    if (!this.isEnabled) {
      throw new Error(`Wrapper for type '${ this.enabledFor.store }/${ this.enabledFor.resource?.id }' in context '${ this.enabledFor.resource?.context }' not supported`);
    }
    const { pagination } = args;
    const opt: ActionFindPageArgs = {
      watch: false,
      pagination,
    };

    // Fetch
    const out: T[] = await this.$store.dispatch(`${ this.enabledFor.store }/findPage`, { opt, type: this.enabledFor.resource?.id });

    // Watch
    if (this.onChange && !this.steveWatchParams) {
      this.steveWatchParams = {
        event:  STEVE_WATCH_EVENT.CHANGES,
        id:     this.id,
        params: {
          type: this.enabledFor.resource?.id as string,
          mode: STEVE_WATCH_MODE.RESOURCE_CHANGES,
        }
      };

      this.watch();
    }

    // Convert
    if (this.classify) {
      return await this.$store.dispatch(`${ this.enabledFor.store }/createMany`, out);
    }

    return out;
  }

  private async watch() {
    if (!this.steveWatchParams) {
      // TODO: RC
      return;
    }
    const watchParams: STEVE_WATCH_EVENT_PARAMS = {
      ...this.steveWatchParams,
      callback: this.onChange as STEVE_WATCH_EVENT_LISTENER_CALLBACK, // we must have it by now
    };

    await this.$store.dispatch(`${ this.enabledFor.store }/watchEvent`, watchParams);
  }

  private async unWatch() {
    if (!this.steveWatchParams) {
      // TODO: RC
      return;
    }

    const unWatchParams: STEVE_UNWATCH_EVENT_PARAMS = { ...this.steveWatchParams };

    await this.$store.dispatch(`${ this.enabledFor.store }/unwatchEvent`, unWatchParams);
  }

  async onDestroy() {
    await this.unWatch();
  }
}

export default PaginationWrapper;
