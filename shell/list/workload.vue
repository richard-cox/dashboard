<script>
import ResourceTable from '@shell/components/ResourceTable';
import { WORKLOAD_TYPES, SCHEMA, NODE, POD } from '@shell/config/types';
import ResourceFetch from '@shell/mixins/resource-fetch';

const schema = {
  id:         'workload',
  type:       SCHEMA,
  attributes: {
    kind:       'Workload',
    namespaced: true
  },
  metadata: { name: 'workload' },
};

export default {
  name:       'ListWorkload',
  components: { ResourceTable },
  mixins:     [ResourceFetch],

  async fetch() {
    try {
      const schema = this.$store.getters[`cluster/schemaFor`](NODE);

      if (schema) {
        this.$store.dispatch('cluster/findAll', { type: NODE });
      }
    } catch {}

    this.loadHeathResources();

    if ( this.allTypes ) {
      this.resources = await Promise.all(this.allowedResources.map((allowed) => {
        return this.$fetchType(allowed, this.allowedResources);
      }));
    } else {
      const type = this.$route.params.resource;

      if ( this.$store.getters['cluster/schemaFor'](type) ) {
        const resource = await this.$fetchType(type);

        this.resources = [resource];
      }
    }
  },

  data() {
    const allowedResources = [];

    Object.values(WORKLOAD_TYPES).forEach((type) => {
      // You may not have RBAC to see some of the types
      if (this.$store.getters['cluster/schemaFor'](type) ) {
        allowedResources.push(type);
      }
    });

    const allTypes = this.$route.params.resource === schema.id;

    return {
      resources:         [],
      allowedResources,
      loadResources:     allTypes ? this.allowedResources : [this.$route.params.resource],
      loadIndeterminate: allTypes
    };
  },

  computed: {
    allTypes() {
      return this.$route.params.resource === schema.id;
    },

    schema() {
      const { params:{ resource:type } } = this.$route;

      if (type !== schema.id) {
        return this.$store.getters['cluster/schemaFor'](type);
      }

      return schema;
    },

    filteredRows() {
      const out = [];

      for ( const typeRows of this.resources ) {
        if ( !typeRows ) {
          continue;
        }

        for ( const row of typeRows ) {
          if (!this.allTypes || row.showAsWorkload) {
            out.push(row);
          }
        }
      }

      return out;
    },
  },

  // All of the resources that we will load that we need for the loading indicator
  $loadingResources() {
    return {
      loadResources:     this.loadResources,
      loadIndeterminate: this.loadIndeterminate,
    };
  },

  methods: {
    loadHeathResources() {
      // Fetch these in the background to populate workload health
      if ( this.allTypes ) {
        this.$store.dispatch('cluster/findAll', { type: POD, opt: { namespaced: this.namespaceFilter } });
        this.$store.dispatch('cluster/findAll', { type: WORKLOAD_TYPES.JOB, opt: { namespaced: this.namespaceFilter } });
      } else {
        const type = this.$route.params.resource;

        if (type === WORKLOAD_TYPES.JOB) {
          // Ignore job (we're fetching this anyway, plus they contain their own state)
          return;
        }

        if (type === WORKLOAD_TYPES.CRON_JOB) {
          this.$store.dispatch('cluster/findAll', { type: WORKLOAD_TYPES.JOB, opt: { namespaced: this.namespaceFilter } });
        } else {
          this.$store.dispatch('cluster/findAll', { type: POD, opt: { namespaced: this.namespaceFilter } });
        }
      }
    }
  },

  typeDisplay() {
    const { params:{ resource:type } } = this.$route;
    let paramSchema = schema;

    if (type !== schema.id) {
      paramSchema = this.$store.getters['cluster/schemaFor'](type);
    }

    return this.$store.getters['type-map/labelFor'](paramSchema, 99);
  },
};
</script>

<template>
  <ResourceTable :loading="$fetchState.pending" :schema="schema" :rows="filteredRows" :overflow-y="true" />
</template>
