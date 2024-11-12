import paginationUtils from '@shell/utils/pagination-utils';
import { PaginationArgs, StorePagination, StorePaginationResult } from 'types/store/pagination.types';
import { VuexStore } from 'types/store/vuex';

interface Result<T> {
  data: Array<T>
  pagination: StorePagination
}

class PaginationWrapper<T = any> {
    private $store: VuexStore;
    private inStore: string;
    private onUpdate: (out: Result<T>) => void; // TODO: RC wire in to web socket

    public isEnabled: boolean;

    /**
    * // TODO: RC descriptions everywhere...
    */
    constructor({
      $store,
      enabledFor,
      onUpdate,
    }: {
        $store: VuexStore,
        onUpdate: (res: Result<T>) => void,
        enabledFor: {
            store: string,
            resource?: {
              id: string,
              context?: string,
            }
          }
        },
    ) {
      this.$store = $store;
      this.isEnabled = paginationUtils.isEnabled({ rootGetters: $store.getters }, enabledFor);
      this.inStore = enabledFor.store;
      this.onUpdate = onUpdate;
    }

    async request(args: {
        type: string,
        pagination: PaginationArgs,
        classify?: boolean,
    }): Promise<Result<T>> {
      const { type, pagination, classify: doClassify } = args;
      const opt = {
        transient: true,
        pagination
      };

      const out: Result<T> = await this.$store.dispatch(`${ this.inStore }/findPage`, { opt, type });

      if (doClassify) {
        for (let i = 0; i < out.data.length; i++) {
          out.data[i] = await this.$store.dispatch(`${ this.inStore }/create`, out.data[i]);
        }
      }

      return out;
    }
}

export default PaginationWrapper;
