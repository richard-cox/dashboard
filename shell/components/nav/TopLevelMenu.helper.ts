import { Cluster } from 'cluster';
import { CAPI, MANAGEMENT } from 'config/types';
import { PaginationParam, PaginationParamFilter, PaginationSort } from 'types/store/pagination.types';
import { VuexStore } from 'types/store/vuex';
import { filterHiddenLocalCluster, filterOnlyKubernetesClusters, paginationFilterClusters } from 'utils/cluster';
import devConsole from 'utils/dev-console';
import PaginationWrapper from 'utils/pagination-wrapper';
import { allHash } from 'utils/promise';
import { sortBy } from 'utils/sort';

// TODO: RC Trigger update on websocket resources.changed message

interface TopLevelMenuCluster {
  id: string,
  label: string,
  ready: boolean
  providerNavLogo: string,
  badge: string,
  isLocal: boolean,
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
/**
 * Order
 * 1. Specific Local Cluster
 * 2. Ready
 * 3. Name
 */
const DEFAULT_SORT: Array<PaginationSort> = [
  // Put local cluster at top of list - https://github.com/rancher/dashboard/issues/10975
  // {
  //   asc:   true,
  //   field: 'spec.internal', // Pending API support https://github.com/rancher/rancher/issues/48011
  // },
  // {
  //   asc:   true,
  //   field: 'status.conditions[0].status' // TODO: RC not currently possible 1) order of conditions is not fixed 2) api cannot do sort by value in a given another value in a
  // },
  // {
  //   asc:   true,
  //   field: 'spec.displayName' // Pending API support https://github.com/rancher/rancher/issues/48011
  // },
];

export interface TopLevelMenuHelper {
  /**
  * Filter mgmt clusters by
  * 1. If harvester or not (filterOnlyKubernetesClusters)
  * 2. If local or not (filterHiddenLocalCluster)
  * 3. Is pinned
  *
  * Sort By
  * 1. is local cluster (appears at top)
  * 2. ready
  * 3. name
  */
  clustersPinned: Array<TopLevelMenuCluster>;

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
  * 2. ready
  * 3. name
  */
  clustersOthers: Array<TopLevelMenuCluster>;

  update: (args: UpdateArgs) => Promise<void>
}

export abstract class BaseTopLevelMenuHelper {
  protected $store: VuexStore;

  /**
  * Filter mgmt clusters by
  * 1. If harvester or not (filterOnlyKubernetesClusters)
  * 2. If local or not (filterHiddenLocalCluster)
  * 3. Is pinned
  *
  * Sort By
  * 1. is local cluster (appears at top)
  * 2. ready
  * 3. name
  */
  public clustersPinned: Array<TopLevelMenuCluster> = [];

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
  * 2. ready
  * 3. name
  */
  public clustersOthers: Array<TopLevelMenuCluster> = [];

  constructor({ $store }: {
    $store: VuexStore,
}) {
    this.$store = $store;
  }

  protected convertToCluster(mgmtCluster: MgmtCluster, provCluster: ProvCluster): TopLevelMenuCluster {
    return {
      id:              mgmtCluster.id,
      label:           mgmtCluster.nameDisplay,
      ready:           mgmtCluster.isReady, // && !provCluster?.hasError,
      providerNavLogo: mgmtCluster.providerMenuLogo,
      badge:           mgmtCluster.badge,
      isLocal:         mgmtCluster.isLocal,
      pinned:          mgmtCluster.pinned,
      description:     provCluster?.description || mgmtCluster.description,
      pin:             () => mgmtCluster.pin(),
      unpin:           () => mgmtCluster.unpin(),
      clusterRoute:    { name: 'c-cluster-explorer', params: { cluster: mgmtCluster.id } }
    };
  }
}

export class TopLevelMenuHelperPagination extends BaseTopLevelMenuHelper implements TopLevelMenuHelper {
  private args?: UpdateArgs;

  private clustersPinnedWrapper: PaginationWrapper;
  private clustersOthersWrapper: PaginationWrapper;
  private provClusterWrapper: PaginationWrapper;

  private commonClusterFilters: PaginationParam[];

  /**
   *
   */
  constructor({ $store }: {
      $store: VuexStore,
  }) {
    devConsole.warn('TLM.helper', 'TopLevelMenuHelperPagination');

    super({ $store });

    this.commonClusterFilters = paginationFilterClusters({ getters: this.$store.getters });

    this.clustersPinnedWrapper = new PaginationWrapper({
      $store,
      onUpdate: () => {
        // TODO: RC trigger on websocket update (only need 1 trigger for this cluster type)
        if (this.args) {
          this.update(this.args);
        }
      },
      enabledFor: {
        store:    'management',
        resource: {
          id:      MANAGEMENT.CLUSTER,
          context: 'side-bar',
        }
      }
    });
    this.clustersOthersWrapper = new PaginationWrapper({
      $store,
      onUpdate: (res) => {
        // TODO: RC trigger on websocket update (only need 1 trigger for this cluster type)
        if (this.args) {
          this.update(this.args);
        }
      },
      enabledFor: {
        store:    'management',
        resource: {
          id:      MANAGEMENT.CLUSTER,
          context: 'side-bar',
        }
      }
    });
    this.provClusterWrapper = new PaginationWrapper({
      $store,
      onUpdate: (res) => {
        // TODO: RC trigger on websocket update
        if (this.args) {
          this.update(this.args);
        }
      },
      enabledFor: {
        store:    'management',
        resource: {
          id:      CAPI.RANCHER_CLUSTER,
          context: 'side-bar',
        }
      }
    });
  }

  // ---------- requests ----------
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
    const provClustersByMgmtId = provClusters.reduce((res: { [mgmtId: string]: ProvCluster}, provCluster: ProvCluster) => {
      if (provCluster.mgmtClusterId) {
        res[provCluster.mgmtClusterId] = provCluster;
      }

      return res;
    }, {} as { [mgmtId: string]: ProvCluster});

    const _clustersNotPinned = res.notPinned
      .filter((mgmtCluster) => !!provClustersByMgmtId[mgmtCluster.id])
      .map((mgmtCluster) => this.convertToCluster(mgmtCluster, provClustersByMgmtId[mgmtCluster.id]));
    const _clustersPinned = res.pinned
      .filter((mgmtCluster) => !!provClustersByMgmtId[mgmtCluster.id])
      .map((mgmtCluster) => this.convertToCluster(mgmtCluster, provClustersByMgmtId[mgmtCluster.id]));

    this.clustersPinned.length = 0;
    this.clustersOthers.length = 0;

    this.clustersPinned.push(..._clustersPinned);
    this.clustersOthers.push(..._clustersNotPinned);
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
    return this.clustersPinnedWrapper.request({
      pagination: {
        filters: this.constructParams({
          pinnedIds:     args.pinnedIds,
          includePinned: true,
        }),
        page:                 1,
        sort:                 DEFAULT_SORT,
        projectsOrNamespaces: []
      },
      classify: true,
    }).then((r) => r.data);
  }

  /**
   * See `clustersOthers` description for details
   */
  private async updateOthers(args: UpdateArgs): Promise<MgmtCluster[]> {
    return this.clustersOthersWrapper.request({
      pagination: {
        filters: this.constructParams({
          searchTerm:        args.searchTerm,
          includeSearchTerm: !!args.searchTerm,
          pinnedIds:         args.pinnedIds,
          excludePinned:     !args.searchTerm,
        }),
        page:                 1,
        pageSize:             args.unPinnedMax,
        sort:                 DEFAULT_SORT,
        projectsOrNamespaces: []
      },
      classify: true,
    }).then((r) => r.data);
  }

  /**
   * Find all provisioning clusters associated with the displayed mgmt clusters
   */
  private async updateProvCluster(notPinned: MgmtCluster[], pinned: MgmtCluster[]): Promise<ProvCluster[]> {
    return this.provClusterWrapper.request({
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
}

export class TopLevelMenuHelperLegacy extends BaseTopLevelMenuHelper implements TopLevelMenuHelper {
  private hasProvCluster: boolean;

  constructor({ $store }: {
    $store: VuexStore,
  }) {
    devConsole.warn('TLM.helper', 'TopLevelMenuHelperLegacy');
    super({ $store });

    this.hasProvCluster = this.$store.getters[`management/schemaFor`](CAPI.RANCHER_CLUSTER);

    if (this.hasProvCluster) {
      $store.dispatch('management/findAll', { type: CAPI.RANCHER_CLUSTER });
    }
  }

  async update(args: UpdateArgs) {
    devConsole.warn('TLM.helper', 'TopLevelMenuHelperLegacy', 'update');
    const clusters = this.updateClusters();
    const _clustersNotPinned = this.clustersFiltered(clusters, args);
    const _clustersPinned = this.pinFiltered(clusters, args);

    devConsole.warn('TLM.helper', 'TopLevelMenuHelperLegacy', 'update', 'res', _clustersPinned, _clustersNotPinned);

    this.clustersPinned.length = 0;
    this.clustersOthers.length = 0;

    this.clustersPinned.push(..._clustersPinned);
    this.clustersOthers.push(..._clustersNotPinned);
  }

  /**
   * Filter mgmt clusters by
   * 1. Harvester type 1 (filterOnlyKubernetesClusters)
   * 2. Harvester type 2 (filterHiddenLocalCluster)
   * 3. There's a matching prov cluster
   *
   * Convert remaining clusters to special format
   */
  private updateClusters(): TopLevelMenuCluster[] {
    devConsole.warn('');
    if (!this.hasProvCluster) {
      // We're filtering out mgmt clusters without prov clusters, so if the user can't see any prov clusters at all
      // exit early
      return [];
    }

    const all = this.$store.getters['management/all'](MANAGEMENT.CLUSTER);
    const mgmtClusters = filterHiddenLocalCluster(filterOnlyKubernetesClusters(all, this.$store), this.$store);
    const provClusters = this.$store.getters['management/all'](CAPI.RANCHER_CLUSTER);
    const provClustersByMgmtId = provClusters.reduce((res: any, provCluster: ProvCluster) => {
      if (provCluster.mgmt?.id) {
        res[provCluster.mgmt.id] = provCluster;
      }

      return res;
    }, {});

    return (mgmtClusters || []).reduce((res: any, mgmtCluster: MgmtCluster) => {
      // Filter to only show mgmt clusters that exist for the available provisioning clusters
      // Addresses issue where a mgmt cluster can take some time to get cleaned up after the corresponding
      // provisioning cluster has been deleted
      if (!provClustersByMgmtId[mgmtCluster.id]) {
        return res;
      }

      res.push(this.convertToCluster(mgmtCluster, provClustersByMgmtId[mgmtCluster.id]));

      return res;
    }, []);
  }

  /**
   * Filter clusters by
   * 1. Not pinned
   * 2. Includes search term
   *
   * Sort remaining clusters
   *
   * Reduce number of clusters if too many too show
   *
   * Important! This is used to show unpinned clusters OR results of search
   */
  private clustersFiltered(clusters: TopLevelMenuCluster[], args: UpdateArgs): TopLevelMenuCluster[] {
    const clusterFilter = args.searchTerm;
    const maxClustersToShow = args.unPinnedMax || 10;

    const search = (clusterFilter || '').toLowerCase();
    let localCluster: MgmtCluster | null = null;

    const filtered = clusters.filter((c) => {
      // If we're searching we don't care if pinned or not
      if (search) {
        if (!c.label?.toLowerCase().includes(search)) {
          return false;
        }
      } else if (c.pinned) {
        // Not searching, not pinned, don't care
        return false;
      }

      if (!localCluster && c.id === 'local') {
        // Local cluster is a special case, we're inserting it at top so don't include in the middle
        localCluster = c;

        return false;
      }

      return true;
    });

    const sorted = sortBy(filtered, ['ready:desc', 'label']);

    // put local cluster on top of list always - https://github.com/rancher/dashboard/issues/10975
    if (localCluster) {
      sorted.unshift(localCluster);
    }

    if (search) {
      // this.showPinClusters = false;
      // this.searchActive = !sorted.length > 0;

      return sorted;
    }
    // this.showPinClusters = true;
    // this.searchActive = false;

    if (sorted.length >= maxClustersToShow) {
      return sorted.slice(0, maxClustersToShow);
    }

    return sorted;
  }

  /**
   * Filter clusters by
   * 1. Not pinned
   * 2. Includes search term
   *
   * Sort remaining clusters
   *
   * Reduce number of clusters if too many too show
   *
   * Important! This is hidden if there's a filter (user searching)
   */
  private pinFiltered(clusters: TopLevelMenuCluster[], args: UpdateArgs): TopLevelMenuCluster[] {
    let localCluster = null;
    const filtered = clusters.filter((c) => {
      if (!c.pinned) {
        // We only care about pinned clusters
        return false;
      }

      if (c.id === 'local') {
        // Special case, we're going to add this at the start so filter out
        localCluster = c;

        return false;
      }

      return true;
    });

    const sorted = sortBy(filtered, ['ready:desc', 'label']);

    // put local cluster on top of list always - https://github.com/rancher/dashboard/issues/10975
    if (localCluster) {
      sorted.unshift(localCluster);
    }

    return sorted;
  }
}
