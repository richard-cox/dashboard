import { MANAGEMENT } from 'config/types';
import { PaginationParam, PaginationParamFilter, PaginationSort } from 'types/store/pagination.types';
import { paginationFilterOnlyKubeClusters } from 'utils/cluster';
import devConsole from 'utils/dev-console';
import PaginationWrapper from 'utils/pagination-wrapper';

interface Cluster {

}

interface UpdateArgs {
    searchTerm: string,
    pinnedIds: string[]
}

interface CTX {
  rootGetters: any,
  dispatch: any,
}

class TopLevelMenuHelper {
  private ctx: CTX;
  private args?: UpdateArgs;

  // public clusters: Array<Cluster> = [];
  // Shown on own
  // public clustersFiltered: Array<Cluster> = [];
  // private clustersFilteredWrapper: PaginationWrapper;

  // Shown together
  public clustersPinned: Array<Cluster> = [];
  private clustersPinnedWrapper: PaginationWrapper;

  public clustersNotPinned: Array<Cluster> = [];
  private clustersNotPinnedWrapper: PaginationWrapper;

  private localCluster: any = undefined;
  private localClusterWrapper: PaginationWrapper;

  private harvesterFilters: PaginationParam | null;

  /**
   *
   */
  constructor({ ctx }: {
      ctx: CTX,
  }) {
    this.ctx = ctx;

    this.harvesterFilters = paginationFilterOnlyKubeClusters({ getters: this.ctx.rootGetters });

    // this.clustersFilteredWrapper = new PaginationWrapper({
    //   ctx,
    //   onUpdate: (res) => {
    //     this.onUpdate();
    //   },
    //   enabledFor: {
    //     store:    'management',
    //     resource: {
    //       id:      MANAGEMENT.CLUSTER,
    //       context: 'aaaaa',
    //     }
    //   }
    // });
    this.clustersPinnedWrapper = new PaginationWrapper({
      ctx,
      onUpdate: (res) => {
        this.onUpdate();
      },
      enabledFor: {
        store:    'management',
        resource: {
          id:      MANAGEMENT.CLUSTER,
          context: 'aaaaa',
        }
      }
    });
    this.clustersNotPinnedWrapper = new PaginationWrapper({
      ctx,
      onUpdate: (res) => {
        this.onUpdate();
      },
      enabledFor: {
        store:    'management',
        resource: {
          id:      MANAGEMENT.CLUSTER,
          context: 'aaaaa',
        }
      }
    });
    this.localClusterWrapper = new PaginationWrapper({
      ctx,
      onUpdate: (res) => {
        this.localCluster = res.data?.[0];
        this.onUpdate();
      },
      enabledFor: {
        store:    'management',
        resource: {
          id:      MANAGEMENT.CLUSTER,
          context: 'aaaaa',
        }
      }
    });
  }

  async onUpdate() {
    if (this.localCluster) {
      // TODO: RC on search term???
      if (this.localCluster.pinned) {
        this.clustersPinned.push(this.localCluster);
      } else {
        this.clustersNotPinned.push(this.localCluster);
      }
    }

    // if (this.args?.searchTerm) {
    //   this.clustersPinned.length = 0;
    //   this.clustersNotPinned.length = 0;

    //   // this.clustersFiltered.length = 0;

    //   if (this.localCluster) {
    //     this.clustersFiltered.push(this.localCluster);
    //   }
    // } else {
    //   this.clustersPinned.length = 0;
    //   this.clustersNotPinned.length = 0;

    //   // this.clustersFiltered.length = 0;

    //   // if (this.localCluster) {
    //   //   if (this.localCluster.pinned) {
    //   //     this.clustersPinned.push(this.localCluster);
    //   //   } else {
    //   //     this.clustersNotPinned.push(this.localCluster);
    //   //   }
    //   // }
    // }
  }

  async update(args: UpdateArgs) {
    this.args = args;
    const promises = [
      this.fetchLocal()
    ];

    // if (args.searchTerm) {
    //   promises.push(this.updateFiltered(args));
    // } else {
    promises.push(this.updatePinned(args));
    promises.push(this.updateNotPinned(args));
    // }

    await Promise.all(promises);
  }

  private static DEFAULT_SORT: Array<PaginationSort> = [
    // {
  //   asc: true,
  //   field: 'isReady' // TODO: RC
  // }
    {
      asc:   true,
      field: 'metadata.name'
    },
  ];

  private addHarvesterParams(params: PaginationParam[]): PaginationParam[] {
    const filters: PaginationParam[] = [];

    if (this.harvesterFilters) {
      filters.push(this.harvesterFilters);
    }

    filters.push(...params);

    return filters;
  }

  /**
   * Filter On
   * 1. Harvester type 1 (filterOnlyKubernetesClusters)
   * 2. Harvester type 2 (filterHiddenLocalCluster)
   * 3. Search Term
   * Sort On
   * 1. Pinned???
   * 2. Ready???
   * 3. metadata.name
   */
  // private updateFiltered(args: UpdateArgs) {
  //   devConsole.warn('updateFiltered', args);

  //   const filters = this.addHarvesterParams([
  //     PaginationParamFilter.createSingleField({ field: 'metadata.name', value: args.searchTerm })
  //   ]);

  //   this.clustersFilteredWrapper.setPagination({
  //     type:       MANAGEMENT.CLUSTER,
  //     pagination: {
  //       filters,
  //       page:                 1,
  //       sort:                 TopLevelMenuHelper.DEFAULT_SORT,
  //       projectsOrNamespaces: []
  //     }
  //   });
  // }

  /**
   * Filter On
   * 1. Harvester type 1 (filterOnlyKubernetesClusters)
   * 2. Harvester type 2 (filterHiddenLocalCluster)
   * 3. Search Term
   * 4. Pinned
   * Sort On
   * 1. Ready???
   * 2. metadata.name
   */
  private updatePinned(args: UpdateArgs) {
    devConsole.warn('updatePinned', args);

    // TODO: RC if pinned arg.pinnedIds includes 'local' AND search term....

    const filters = this.addHarvesterParams([
      PaginationParamFilter.createMultipleFields(
        args.pinnedIds.map((id) => ({
          field: 'id', value: id, equals: true, exact: true
        }))
      )
    ]);

    this.clustersPinnedWrapper.setPagination({
      type:       MANAGEMENT.CLUSTER,
      pagination: {
        filters,
        page:                 1,
        sort:                 TopLevelMenuHelper.DEFAULT_SORT,
        projectsOrNamespaces: []
      }
    });
  }

  /**
   * Filter On
   * 1. Harvester type 1 (filterOnlyKubernetesClusters)
   * 2. Harvester type 2 (filterHiddenLocalCluster)
   * 3. Search Term
   * 4. Pinned
   * Sort On
   * 1. Ready???
   * 2. metadata.name
   */
  private updateNotPinned(args: UpdateArgs) {
    devConsole.warn('updateNotPinned', args);

    const filters = this.addHarvesterParams(args.pinnedIds.map((id) => PaginationParamFilter.createSingleField({
      field: 'id', equals: false, value: id
    })));

    this.clustersNotPinnedWrapper.setPagination({
      type:       MANAGEMENT.CLUSTER,
      pagination: {
        filters,
        page:                 1,
        pageSize:             10,
        sort:                 TopLevelMenuHelper.DEFAULT_SORT,
        projectsOrNamespaces: []
      }
    });
  }

  private fetchLocal() {
    devConsole.warn('fetchLocal');

    this.localClusterWrapper.setPagination({
      type:       MANAGEMENT.CLUSTER,
      pagination: {
        filters:              [PaginationParamFilter.createSingleField({ field: 'metadata.name', value: 'local' })],
        page:                 1,
        pageSize:             1,
        sort:                 [],
        projectsOrNamespaces: []
      }
    });
  }
}

export default TopLevelMenuHelper;
