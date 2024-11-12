import { CAPI, MANAGEMENT } from 'config/types';
import { PaginationParam, PaginationParamFilter, PaginationSort } from 'types/store/pagination.types';
import { VuexStore } from 'types/store/vuex';
import { paginationFilterClusters, paginationFilterOnlyKubernetesClusters } from 'utils/cluster';
import devConsole from 'utils/dev-console';
import PaginationWrapper from 'utils/pagination-wrapper';
import { allHash } from 'utils/promise';

interface TopLevelMenuCluster {
  id: string,
  label: string,
  ready: boolean
  osLogo: string,
  providerNavLogo: string,
  badge: string,
  isLocal: boolean,
  isHarvester: boolean,
  pinned: boolean,
  description: string,
  pin: () => void,
  unpin: () => void,
  clusterRoute: any, // TODO: RC route
}

interface UpdateArgs {
  searchTerm: string,
  pinnedIds: string[],
  unPinnedMax?: number, // TODO: RC finish off
}

type MgmtCluster = {
  [key: string]: any
}

type ProvCluster = {
  [key: string]: any
}

class TopLevelMenuHelper {
  private $store: VuexStore;
  private args?: UpdateArgs;

  /**
    * Filter mgmt clusters by
    * 1. If harvester or not (filterOnlyKubernetesClusters)
    * 2. If local or not (filterHiddenLocalCluster)
    * 3. Is pinned
    *
    * Sort By
    * 1. is local cluster (appears at top)
    * 2. ready // TODO: RC
    * 3. metadata.name // TODO: RC change to  spec.displayName
    */
  public clustersPinned: Array<TopLevelMenuCluster> = [];
  private clustersPinnedWrapper: PaginationWrapper;

  /**
    * Filter mgmt clusters by
    * 1. If harvester or not (filterOnlyKubernetesClusters)
    * 2. If local or not (filterHiddenLocalCluster)
    * 3.
    * a) if search term, filter on it
    * b) if no search term, filter on pinned
    *
    * Sort By
    * 1. is local cluster (appears at top)
    * 2. ready // TODO: RC
    * 3. metadata.name // TODO: RC change to  spec.displayName
    */
  public clustersOthers: Array<TopLevelMenuCluster> = [];
  private clustersOthersWrapper: PaginationWrapper;

  private static DEFAULT_SORT: Array<PaginationSort> = [
    // Put local cluster at top of list - https://github.com/rancher/dashboard/issues/10975
    // {
    //   asc:   true,
    //   field: 'spec.internal', // Pending API support https://github.com/rancher/rancher/issues/48011
    // },
    // TODO: RC REGRESSION mgmtCluster.isReady && !pCluster?.hasError,
    // {
    //   asc:   true,
    //   field: 'status.conditions[0].status' // TODO: RC not currently possible 1) order of conditions is not fixed 2) api cannot do sort by value in a given another value in a
    // },
    {
      asc:   true,
      field: 'metadata.name'
    },
  ];

  private provClusterWrapper: PaginationWrapper;

  private commonClusterFilters: PaginationParam[];

  /**
   *
   */
  constructor({ $store }: {
      $store: VuexStore,
  }) {
    this.$store = $store;

    this.commonClusterFilters = paginationFilterClusters({ getters: this.$store.getters });

    this.clustersPinnedWrapper = new PaginationWrapper({
      $store,
      onUpdate: (res) => {
        // TODO: RC test
        devConsole.warn('clustersPinned onUpdate', this.clustersPinned);

        if (this.args) {
          this.update(this.args);
        }
      },
      enabledFor: {
        store:    'management',
        resource: {
          id:      MANAGEMENT.CLUSTER,
          context: 'aaaaa',
        }
      }
    });
    this.clustersOthersWrapper = new PaginationWrapper({
      $store,
      onUpdate: (res) => {
        // TODO: RC test
        devConsole.warn('clustersNotPinnedWrapper onUpdate', this.clustersOthers);

        if (this.args) {
          this.update(this.args);
        }
      },
      enabledFor: {
        store:    'management',
        resource: {
          id:      MANAGEMENT.CLUSTER,
          context: 'aaaaa',
        }
      }
    });
    this.provClusterWrapper = new PaginationWrapper({
      $store,
      onUpdate: (res) => {
        // TODO: RC test
        // if a prov cluster is deleted it should get removed from list...
      },
      enabledFor: {
        store:    'management',
        resource: {
          id:      CAPI.RANCHER_CLUSTER,
          context: 'aaaaa',
        }
      }
    });
  }

  // ---------- handle requests
  async update(args: UpdateArgs) {
    this.args = args;
    const promises = {
      pinned:    this.updatePinned(args),
      notPinned: this.updateOthers(args)
    };

    const res: {
      pinned: MgmtCluster[],
      notPinned: MgmtCluster[]
    } = await allHash(promises) as any;
    const provClusters = await this.updateProvCluster(res.notPinned, res.pinned);

    devConsole.warn('update', 'res', res.pinned, res.notPinned, provClusters);

    const provClustersByMgmtId = provClusters.reduce((res: { [mgmtId: string]: ProvCluster}, provCluster: ProvCluster) => {
      if (provCluster.mgmtClusterId) {
        res[provCluster.mgmtClusterId] = provCluster;
      }

      return res;
    }, {} as { [mgmtId: string]: ProvCluster});

    devConsole.warn('update', 'provClustersByMgmtId', provClustersByMgmtId);

    const _clustersNotPinned = res.notPinned
      .filter((mgmtCluster) => !!provClustersByMgmtId[mgmtCluster.id])
      .map((mgmtCluster) => this.convertToCluster(mgmtCluster, provClustersByMgmtId[mgmtCluster.id]));

    this.clustersOthers.length = 0;
    this.clustersOthers.push(..._clustersNotPinned);

    const _clustersPinned = res.pinned
      .filter((mgmtCluster) => !!provClustersByMgmtId[mgmtCluster.id])
      .map((mgmtCluster) => this.convertToCluster(mgmtCluster, provClustersByMgmtId[mgmtCluster.id]));

    this.clustersPinned.length = 0;
    this.clustersPinned.push(..._clustersPinned);

    devConsole.warn('update', 'end', this.clustersPinned, this.clustersOthers);
  }

  private constructParams({
    pinnedIds,
    searchTerm,
    includeLocal,
    includeSearchTerm,
    includePinned,
    excludePinned,
  }: {
    pinnedIds?: string[],
    searchTerm?: string,
    includeLocal?: boolean,
    includeSearchTerm?: boolean,
    includePinned?: boolean,
    excludePinned?: boolean,
  }): PaginationParam[] {
    const filters: PaginationParam[] = [...this.commonClusterFilters];

    if (pinnedIds) {
      if (includePinned) {
        // cluster id is 1 OR 2 OR 3 OR 4...
        filters.push(PaginationParamFilter.createMultipleFields(
          pinnedIds.map((id) => ({
            field: 'id', value: id, equals: true, exact: true
          }))
        ));
      }

      if (excludePinned) {
        // cluster id is NOT 1 AND NOT 2 OR 3 OR 4...
        filters.push(...pinnedIds.map((id) => PaginationParamFilter.createSingleField({
          field: 'id', equals: false, value: id
        })));
      }
    }

    if (searchTerm && includeSearchTerm) {
      // Pending API support https://github.com/rancher/rancher/issues/48011
      // filters.push(PaginationParamFilter.createSingleField({
      //   field: 'spec.displayName', exact: false, value: searchTerm
      // }));
    }

    if (includeLocal) {
      filters.push(PaginationParamFilter.createSingleField({ field: 'id', value: 'local' }));
    }

    return filters;
  }

  /**
   * See `clustersPinned` description for details
   */
  private async updatePinned(args: UpdateArgs): Promise<MgmtCluster[]> {
    devConsole.warn('updatePinned', args);

    return this.clustersPinnedWrapper.request({
      type:       MANAGEMENT.CLUSTER,
      pagination: {
        filters: this.constructParams({
          pinnedIds:     args.pinnedIds,
          includePinned: true,
        }),
        page:                 1,
        sort:                 TopLevelMenuHelper.DEFAULT_SORT,
        projectsOrNamespaces: []
      },
      classify: true,
    }).then((r) => r.data);
  }

  /**
   * Filter On
   * 1. Harvester type 1 (filterOnlyKubernetesClusters)
   * 2. Cluster type 2 (filterHiddenLocalCluster)
   * 3. Search Term
   * 4. Not Pinned
   * Sort On
   * 1. Ready???
   * 2. metadata.name
   */
  private async updateOthers(args: UpdateArgs): Promise<MgmtCluster[]> {
    devConsole.warn('updateOthers', args);

    return this.clustersOthersWrapper.request({
      type:       MANAGEMENT.CLUSTER,
      pagination: {
        filters: this.constructParams({
          searchTerm:        args.searchTerm,
          includeSearchTerm: !!args.searchTerm,
          pinnedIds:         args.pinnedIds,
          excludePinned:     !args.searchTerm,
        }),
        page:                 1,
        pageSize:             args.unPinnedMax,
        sort:                 TopLevelMenuHelper.DEFAULT_SORT,
        projectsOrNamespaces: []
      },
      classify: true,
    }).then((r) => r.data);
  }

  private async updateProvCluster(notPinned: MgmtCluster[], pinned: MgmtCluster[]): Promise<ProvCluster[]> {
    devConsole.warn('updateProvCluster', pinned, notPinned);

    return this.provClusterWrapper.request({
      type:       CAPI.RANCHER_CLUSTER,
      pagination: {
        filters:              [],
        // Pending API support https://github.com/rancher/rancher/issues/48011
        // filters: [
        //   PaginationParamFilter.createMultipleFields(
        //     [...notPinned, ...pinned]
        //       .map((mgmtCluster) => ({
        //         field: 'status.clusterName', value: mgmtCluster.id, equals: true, exact: true
        //       }))
        //   )
        // ],
        page:                 1,
        sort:                 [],
        projectsOrNamespaces: []
      },
      classify: true,
    }).then((r) => r.data);
  }

  // ---------- handle responses

  private convertToCluster(mgmtCluster: MgmtCluster, provCluster: ProvCluster): TopLevelMenuCluster {
    // const clusters: Cluster[] = [];
    const pCluster = provCluster;

    return {

      // TODO: RC are all these needed now?
      id:              mgmtCluster.id,
      label:           mgmtCluster.nameDisplay,
      ready:           mgmtCluster.isReady && !pCluster?.hasError,
      osLogo:          mgmtCluster.providerOsLogo,
      providerNavLogo: mgmtCluster.providerMenuLogo,
      badge:           mgmtCluster.badge,
      isLocal:         mgmtCluster.isLocal,
      isHarvester:     mgmtCluster.isHarvester,
      pinned:          mgmtCluster.pinned,
      description:     pCluster?.description || mgmtCluster.description,
      pin:             () => mgmtCluster.pin(),
      unpin:           () => mgmtCluster.unpin(),
      clusterRoute:    { name: 'c-cluster-explorer', params: { cluster: mgmtCluster.id } }
    };
  }
}

export default TopLevelMenuHelper;
