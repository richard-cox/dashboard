import paginationUtils from '@shell/utils/pagination-utils';
import { PaginationArgs, StorePagination, StorePaginationResult } from 'types/store/pagination.types';

interface Result<T> {
    data: Array<T>
  pagination: StorePagination
}

// TODO: RC
interface CTX {
  rootGetters: any,
  dispatch: any,
}

class PaginationWrapper<T = any> {
    private ctx: CTX;
    private inStore: string;
    private onUpdate: (out: Result<T>) => void;

    public isEnabled: boolean;

    // public result?: StorePaginationResult;
    // public rows?: Array<T>;

    /**
    *
    */
    constructor({
      ctx,
      enabledFor,
      onUpdate,
    }: {
        ctx: CTX,
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
      this.ctx = ctx;
      this.isEnabled = paginationUtils.isEnabled(ctx, enabledFor);
      this.inStore = enabledFor.store;
      this.onUpdate = onUpdate;
    }

    async setPagination(args: {
        type: string,
        pagination: PaginationArgs
    }) {
    //   const type = type = this.ctx.getters[`${ inStore }/normalizeType`](type);
      const { type, pagination } = args;
      const opt = {
        transient: true,
        pagination
      };

      //   const out = await this.ctx.dispatch(`${ inStore }/request`, { opt, type });
      const out = await this.ctx.dispatch(`${ this.inStore }/findPage`, { opt, type });

      this.onUpdate(out);
    }
}

export default PaginationWrapper;
