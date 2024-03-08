<script lang="ts">
import ResourceTable from '@shell/components/ResourceTable';
import Tag from '@shell/components/Tag';
import { Banner } from '@components/Banner';
import {
  STATE, NAME, ROLES, VERSION, INTERNAL_EXTERNAL_IP, CPU, RAM, PODS, AGE, KUBE_NODE_OS
} from '@shell/config/table-headers';
import metricPoller from '@shell/mixins/metric-poller';

import { CAPI as CAPI_ANNOTATIONS, NODE_ROLES, RKE, SYSTEM_LABELS } from '@shell/config/labels-annotations.js';

import { defineComponent, PropType } from 'vue';
import { FindAllOpt, StorePaginationResult } from '@shell/types/store/dashboard-store.types';
import {
  CAPI,
  MANAGEMENT, METRIC, NODE, NORMAN, POD
} from '@shell/config/types';
import { allHash } from '@shell/utils/promise';
import { GROUP_RESOURCES, mapPref } from '@shell/store/prefs';
import { COLUMN_BREAKPOINTS } from '@shell/components/SortableTable/index.vue';
import ResourceFetch from '@shell/mixins/resource-fetch';

export default defineComponent({
  name:       'ListNode',
  components: {
    ResourceTable,
    Tag,
    Banner
  },
  mixins: [metricPoller, ResourceFetch],

  props: {
    resource: {
      type:     String,
      required: true,
    },
    schema: {
      type:     Object,
      required: true,
    },
    useQueryParamsForSimpleFiltering: {
      type:    Boolean,
      default: false
    },

    listComponent: {
      type:    Boolean,
      default: false
    }
  },

  async fetch() {
    try {
      this.$initializeFetchData(this.resource);

      const hash: any = { kubeNodes: this.$fetchType(this.resource) };

      // Remove fetching all pods from node list
      // Node List - node` podConsume --> ready pods per node in list
      // Node Detail - node podConsume --> ready pods for node
      // Node Detail - pods for node (paginatinated)

      // TODO: RC podConsumedUsage = podConsumed / podConsumedUsage. podConsumed --> pods. allPods.filter((pod) => pod.spec.nodeName === this.name)

      // List - requires updated list? fetch static when page changes
      // Node Detail - needs paginated pods list.... but also filtered pods list

      // Convert node list over. secondary resources... need to react to page change again. Populate store with filtered lists... so model getters just work as is?
      // Could make http request on pag change? how to keep uo to date?

      // TODO: RC all of this. if page changes get notified... fetch required resources
      // fetchType trigger / pagination settings change / page results changed

      this.canViewPods = this.$store.getters[`cluster/schemaFor`](POD) && !this.pagination;

      // if (this.$store.getters[`management/schemaFor`](MANAGEMENT.NODE)) {
      //   // Required for Drain/Cordon action
      //   hash.normanNodes = this.$fetchType(NORMAN.NODE, [], 'rancher');
      // }

      // if (this.$store.getters[`rancher/schemaFor`](NORMAN.NODE)) {
      //   hash.mgmtNodes = this.$fetchType(MANAGEMENT.NODE, [], 'management');
      // }

      // if (this.$store.getters[`management/schemaFor`](CAPI.MACHINE)) {
      //   // Required for ssh / download key actions
      //   hash.machines = this.$fetchType(CAPI.MACHINE, [], 'management');
      // }

      if (this.canViewPods) {
      // Used for running pods metrics - we don't need to block on this to show the list of nodes
        this.$fetchType(POD); // TODO: RC get pods on specific node? get pods on page?
      }

      await allHash(hash);
    } catch (e) {
      console.error(e);
    }
  },

  data() {
    return { canViewPods: false };
  },

  beforeDestroy() {
    // Stop watching pods, nodes and node metrics
    // TODO: RC
    if (this.canViewPods) {
      this.$store.dispatch('cluster/forgetType', POD);
    }

    this.$store.dispatch('cluster/forgetType', NODE);
    this.$store.dispatch('cluster/forgetType', METRIC.NODE);
  },

  computed: {
    hasWindowsNodes() {
      // TODO: RC only valid for current page
      return (this.rows || []).some((node: any) => node.status.nodeInfo.operatingSystem === 'windows');
    },

    tableGroup: mapPref(GROUP_RESOURCES),

    headers() {
      if (this.canPaginate) {
        const paginationHeaders = this.$store.getters['type-map/headersFor'](this.schema, true);

        if (paginationHeaders) {
          return paginationHeaders;
        } else {
          console.warn('Nodes list expects pagination headers but none found');

          return [];
        }
      }

      const headers = this.$store.getters['type-map/headersFor'](this.schema, false); // TODO: RC TEST

      if (this.canViewPods) {
        headers.slice(headers.length - 2, {
          ...PODS,
          breakpoint: COLUMN_BREAKPOINTS.DESKTOP,
          getValue:   (row: any) => row.podConsumedUsage
        });
      }

      return headers;
    },
  },

  methods: {
    async loadMetrics() {
      const schema = this.$store.getters['cluster/schemaFor'](METRIC.NODE);

      // TODO: RC exclude metadata.fields not added

      if (schema) {
        // TODO: RC HEEEEEERE
        const opt: FindAllOpt = {
          watch:      false,
          force:      true,
          pagination: {
            page:     1,
            pageSize: -1,
            sort:     [{
              field: 'metadata.name',
              asc:   true,
            }],
            filter: this.rows.map((r: any) => ({
              field: 'status.nodeName',
              value: r.id
            })),
          }
        };

        await this.$store.dispatch('cluster/findAll', {
          type: METRIC.NODE,
          opt:  { force: true }
        });

        this.$forceUpdate();
      }
    },

    toggleLabels(row: any) {
      this.$set(row, 'displayLabels', !row.displayLabels);
    },
  },

  watch: {
    paginationResult(neu: StorePaginationResult, old: StorePaginationResult) {
      if (!neu || neu.timestamp === old?.timestamp || !this.rows?.length) {
        return;
      }

      const canViewMgmtNodes = this.$store.getters[`management/schemaFor`](MANAGEMENT.NODE);
      const canViewNormanNodes = this.$store.getters[`rancher/schemaFor`](NORMAN.NODE);
      const canViewCAPIMachines = this.$store.getters[`management/schemaFor`](CAPI.MACHINE);

      if (canViewMgmtNodes && canViewNormanNodes) {
        // Norman node required for Drain/Cordon/Uncordon action
        // Mgmt Node required to find Norman node

        const opt: FindAllOpt = {
          watch:      false,
          force:      false,
          pagination: {
            page:     1,
            pageSize: -1,
            sort:     [{
              field: 'metadata.name',
              asc:   true,
            }],
            filter: this.rows.map((r: any) => ({
              field: 'status.nodeName',
              value: r.id
            })),
          }
        };

        this.$store.dispatch(`management/findAll`, {
          type: MANAGEMENT.NODE,
          opt
        });

        this.$store.dispatch(`rancher/findAll`, { type: NORMAN.NODE });
      }

      if (canViewCAPIMachines) {
        const opt: FindAllOpt = {
          watch:      false,
          force:      false,
          pagination: {
            page:     1,
            pageSize: -1,
            sort:     [{
              field: 'metadata.name',
              asc:   true,
            }],
            filter: this.rows
              .map((r: any) => {
                const namespace = r.metadata?.annotations?.[CAPI_ANNOTATIONS.CLUSTER_NAMESPACE];
                const name = r.metadata?.annotations?.[CAPI_ANNOTATIONS.MACHINE_NAME];

                return namespace && name ? {
                  field: 'id',
                  value: `${ namespace }/${ name }`,
                } : null;
              })
              .filter((r: any) => !!r)
            // filter: [{
            //   field: 'metadata.name',
            //   value: ''
            // }]
          }
        };

        this.$store.dispatch(`management/findAll`, {
          type: CAPI.MACHINE,
          opt
        });
      }
    },
  }

});
</script>

<template>
  <!-- v-if="initialFetchCompleted" -->
  <div>
    <Banner
      v-if="hasWindowsNodes"
      color="info"
      :label="t('cluster.custom.registrationCommand.windowsWarning')"
    />
    <br>node: {{ canPaginate }}, {{ isResourceList }} {{ resource }}
    <ResourceTable
      v-bind="$attrs"
      :schema="schema"
      :headers="headers"
      :rows="rows"
      :sub-rows="true"
      :loading="loading"
      :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
      :force-update-live-and-delayed="forceUpdateLiveAndDelayed"
      data-testid="cluster-node-list"
      :external-pagination="canPaginate"
      :external-pagination-result="paginationResult"
      @pagination-changed="paginationChanged"
      v-on="$listeners"
    >
      <template #sub-row="{fullColspan, row, onRowMouseEnter, onRowMouseLeave}">
        <tr
          class="taints sub-row"
          :class="{'empty-taints': ! row.displayTaintsAndLabels}"
          @mouseenter="onRowMouseEnter"
          @mouseleave="onRowMouseLeave"
        >
          <template v-if="row.displayTaintsAndLabels">
            <td>&nbsp;</td>
            <td>&nbsp;</td>
            <td :colspan="fullColspan-2">
              <span v-if="row.spec.taints && row.spec.taints.length">
                {{ t('node.list.nodeTaint') }}:
                <Tag
                  v-for="taint in row.spec.taints"
                  :key="taint.key + taint.value + taint.effect"
                  class="mr-5 mt-2"
                >
                  {{ taint.key }}={{ taint.value }}:{{ taint.effect }}
                </Tag>
              </span>
              <span
                v-if="!!row.customLabelCount"
                class="mt-5"
              > {{ t('node.list.nodeLabels') }}:
                <span
                  v-for="(label, i) in row.customLabels"
                  :key="i"
                  class="mt-5 labels"
                >
                  <Tag
                    v-if="i < 7"
                    class="mr-2 label"
                  >
                    {{ label }}
                  </Tag>
                  <Tag
                    v-else-if="i > 6 && row.displayLabels"
                    class="mr-2 label"
                  >
                    {{ label }}
                  </Tag>
                </span>
                <a
                  v-if="row.customLabelCount > 7"
                  href="#"
                  @click.prevent="toggleLabels(row)"
                >
                  {{ t(`node.list.${row.displayLabels? 'hideLabels' : 'showLabels'}`) }}
                </a>
              </span>
            </td>
          </template>
          <td
            v-else
            :colspan="fullColspan"
          >
&nbsp;
          </td>
        </tr>
      </template>
    </ResourceTable>
  </div>
</template>

<style lang='scss' scoped>

.labels {
    display: inline;
    flex-wrap: wrap;

    .label {
      display: inline-block;
      margin-top: 2px;
    }

}
.taints {
  td {
    padding-top:0;
    .tag {
      margin-right: 5px;
      display: inline-block;
      margin-top: 2px;
    }
  }
  &.empty-taints {
    // No taints... so hide sub-row (but not bottom-border)
    height: 0;
    line-height: 0;
    td {
      padding: 0;
    }
  }
}

</style>
