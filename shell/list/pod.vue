<script>
import ResourceTable from '@shell/components/ResourceTable';
import { NODE, METRIC } from '@shell/config/types';
import ResourceFetch from '@shell/mixins/resource-fetch';

export default {
  name:       'ListPod',
  components: { ResourceTable },
  mixins:     [ResourceFetch],
  props:      {
    resource: {
      type:     String,
      required: true,
    },

    headers: {
      type:    Array,
      default: null,
    },

    schema: {
      type:     Object,
      required: true,
    },

    useQueryParamsForSimpleFiltering: {
      type:    Boolean,
      default: false
    }
  },

  // fetch nodes before loading this page, as they may be referenced in the Target table column
  async fetch() {
    const store = this.$store;
    const inStore = store.getters['currentStore']();

    this.$initializeFetchData(this.resource);

    if (store.getters[`${ inStore }/schemaFor`](METRIC.POD)) {
      this.$fetchType(METRIC.POD); // TODO: RC scale, spam

      this.customHeaders = [
        ...this.$store.getters['type-map/headersFor'](this.schema),
        {
          name:          'cpu',
          labelKey:      'tableHeaders.cpu',
          getValue:      (row) => row.cpu,
          sort:          false,
          search:        false,
          formatter:     'Si',
          formatterOpts: { increment: 1000, firstSuffix: 'C' }
        }, {
          name:      'mem',
          labelKey:  'tableHeaders.memory',
          getValue:  (row) => row.mem,
          sort:      false,
          search:    false,
          formatter: 'Si',
        }];
    }

    await this.$fetchType(this.resource);
  },

  data() {
    return { customHeaders: null };
  }
};
</script>

<template>
  <ResourceTable
    :schema="schema"
    :rows="rows"
    :headers="customHeaders"
    :group-by="$attrs.groupBy"
    :loading="loading"
    :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
    :force-update-live-and-delayed="forceUpdateLiveAndDelayed"
  />
</template>
