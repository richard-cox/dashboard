<script lang="ts">
import ResourceTable from '@shell/components/ResourceTable.vue';
import Tag from '@shell/components/Tag.vue';
import { Banner } from '@components/Banner';
import {
  STATE, NAME, ROLES, VERSION, INTERNAL_EXTERNAL_IP, CPU, RAM, PODS, AGE, KUBE_NODE_OS
} from '@shell/config/table-headers';
import metricPoller from '@shell/mixins/metric-poller';

import { CAPI as CAPI_ANNOTATIONS, NODE_ROLES, RKE, SYSTEM_LABELS } from '@shell/config/labels-annotations.js';

import { defineComponent, PropType } from 'vue';
import { ActionFindAllArgs, ActionFindPageArgs, StorePaginationResult } from '@shell/types/store/dashboard-store.types';
import {
  CAPI,
  MANAGEMENT, METRIC, NODE, NORMAN, POD
} from '@shell/config/types';
import { allHash } from '@shell/utils/promise';
import { GROUP_RESOURCES, mapPref } from '@shell/store/prefs';
import { COLUMN_BREAKPOINTS } from '@shell/components/SortableTable/index.vue';
import ResourceFetch from '@shell/mixins/resource-fetch';
import { mapGetters } from 'vuex';

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
      // TODO: RC decide - fetching pods for current page could be a LOT still (300 per node, 100 nodes, 3000 in response)
      this.canViewPods = this.$store.getters[`cluster/schemaFor`](POD); // && !this.pagination
      this.canViewNormanNodes = this.$store.getters[`rancher/schemaFor`](NORMAN.NODE);
      this.canViewMgmtNodes = this.$store.getters[`management/schemaFor`](MANAGEMENT.NODE);
      this.canViewMachines = this.$store.getters[`management/schemaFor`](CAPI.MACHINE);

      if (!this.canPaginate) {
        if (this.canViewNormanNodes) {
          // Required for Drain/Cordon action
          hash.normanNodes = this.$fetchType(NORMAN.NODE, [], 'rancher');
        }

        if (this.canViewMgmtNodes) {
          hash.mgmtNodes = this.$fetchType(MANAGEMENT.NODE, [], 'management');
        }

        if (this.canViewMachines) {
          // Required for ssh / download key actions
          hash.machines = this.$fetchType(CAPI.MACHINE, [], 'management');
        }

        if (this.canViewPods) {
          // Used for running pods metrics - we don't need to block on this to show the list of nodes
          this.$fetchType(POD);
        }
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
    // TODO: RC stop if others
    if (this.canViewPods) {
      this.$store.dispatch('cluster/forgetType', POD);
    }

    this.$store.dispatch('cluster/forgetType', NODE);
    this.$store.dispatch('cluster/forgetType', METRIC.NODE);
  },

  computed: {
    ...mapGetters(['currentCluster']),
    hasWindowsNodes() {
      // TODO: RC only valid for current page
      return (this.rows || []).some((node: any) => node.status.nodeInfo.operatingSystem === 'windows');
    },

    tableGroup: mapPref(GROUP_RESOURCES),

    headers() {
      // TODO: RC tidy up
      if (this.canPaginate) {
        const paginationHeaders = [...this.$store.getters['type-map/headersFor'](this.schema, true)];

        if (paginationHeaders) {
          if (this.canViewPods) {
            debugger;
            paginationHeaders.splice(paginationHeaders.length - 1, 0, {
              ...PODS,
              breakpoint: COLUMN_BREAKPOINTS.DESKTOP,
              sort:       false,
              search:     false,
              getValue:   (row: any) => row.podConsumedUsage
            });
          }

          return paginationHeaders;
        } else {
          console.warn('Nodes list expects pagination headers but none found');

          return [];
        }
      }

      const headers = [...this.$store.getters['type-map/headersFor'](this.schema, false)]; // TODO: RC TEST

      if (this.canViewPods) {
        headers.splice(headers.length - 1, 0, {
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
        const opt: ActionFindPageArgs = {
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

        await this.$store.dispatch('cluster/findPage', {
          type: METRIC.NODE,
          opt
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
        const opt: ActionFindPageArgs = {
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

        this.$store.dispatch(`management/findPage`, {
          type: MANAGEMENT.NODE,
          opt
        });

        this.$store.dispatch(`rancher/findAll`, { type: NORMAN.NODE });
      }

      if (canViewCAPIMachines) {
        const namespace = this.currentCluster.provClusterId?.split('/')[0];

        if (namespace) {
          const opt: ActionFindPageArgs = {
            force:      false,
            pagination: {
              page:     1,
              pageSize: -1,
              sort:     [{ // TODO: RC remove sort from these?
                field: 'metadata.name',
                asc:   true,
              }],
              // Note - we cannot filter by (namespace and name) OR (namespace and name)
              // All nodes should be in the same namespace, so use that here
              namespaces: [namespace],
              filter:     this.rows
                .map((r: any) => {
                  const name = r.metadata?.annotations?.[CAPI_ANNOTATIONS.MACHINE_NAME];

                  return name ? {
                    field: 'spec.nodeName',
                    value: this.name,
                  } : null;
                })
                .filter((r: any) => !!r)
            }
          };

          this.$store.dispatch(`management/findPage`, {
            type: CAPI.MACHINE,
            opt
          });
        }
      }

      if (this.canViewPods) {
        // // Used for running pods metrics - we don't need to block on this to show the list of nodes
        //   this.$fetchType(POD); // TODO: RC
        const opt: ActionFindPageArgs = {
          force:      false,
          pagination: {
            page:     1,
            pageSize: -1,
            sort:     [{ // TODO: RC remove sort from these?
              field: 'metadata.name',
              asc:   true,
            }],
            filter: this.rows
              .map((r: any) => ({
                field: 'spec.nodeName',
                value: r.id,
              }))
              .filter((r: any) => !!r)
          }
        };

        this.$store.dispatch(`cluster/findPage`, {
          type: POD,
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
      :external-pagination-enabled="canPaginate"
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
