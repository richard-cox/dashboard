// TODO: RC UX create resource in different NS. return to list (shrug?)

// TODO: RC Comment - If we're under the threshold and have fetched all resources, if in that session we go over the threshold we won't enforce the NS filter (because we have all already)
// TODO: RC Comment - If we're over the threshold and have fetched namespaced resources, if in that session we go under the threshold we will fetch all resources
// TODO: RC Comment - If we're over the threshold and have fetched namespaced resources, going to a page that needs them all will result in us fetching them all (for instance from `events` to `cluster dashboard`)
// TODO: RC Comment - Gates for forcing the filter (count, resource type is namespaced, etc) apply only to the resources shown in the list.
// TODO: RC Comment - - For example PV's aren't namespaced, so no enforced filtering. However they fetch PVC's which are namespaced
// TODO: RC Comment - does not take in to account sub resource count

// TODO: RC TEST - manual refresh
// TODO: RC TEST - incremental loading
// TODO: RC TEST - manual refresh + incremental loading

// TODO: RC xTEST - have all and under count. go away and create. come back
// TODO: RC xTEST - have too many and over count. go away and remove. come back
// TODO: RC xTEST - select multiple filters after filtering to one NS
// TODO: RC xTEST if already have deployments... but ns filter is different
// TODO: RC xdon't group by namespaces if request is namespaced (should be automatic)
// TODO: RC xTEST - go from deployment namespaced to somewhere that needs them all

import { mapGetters } from 'vuex';

export default {

  computed: {
    ...mapGetters(['currentCluster', 'isSingleNamespace']),

    /**
     * Does the user need to update filter to supply a single namespace?
     */
    namespaceFilterRequired() {
      this.log('rfn mixin', 'namespaceFilterRequired', this.__namespaceRequired, !this.__singleNamespaceFilter);

      return this.__namespaceRequired && !this.__singleNamespaceFilter;
    },

    /**
     * Returns the name of the required namespace to filter by
     */
    namespaceFilter() {
      return this.__namespaceRequired ? this.__singleNamespaceFilter : '';
    },

    /**
     * If the Project/Namespace filter from the header contains a single NS... return it
     */
    __singleNamespaceFilter() {
      const ns = this.isSingleNamespace;

      return ns ? ns.replace('ns://', '') : '';
    },

    /**
     * Do we need to filter the list by a namespace?
     */
    __namespaceRequired() {
      this.log('rfn mixin', '__namespaceRequired', this.__areResourcesNamespaced, this.__areResourcesTooMany, this.perfConfig);

      if (!this.forceNsFilter?.enabled || this.perfConfig.forceNsFilter.threshold === undefined) {
        return false;
      }

      return this.__areResourcesNamespaced && this.__areResourcesTooMany;
    },

    /**
     * Are all core list resources namespaced?
     */
    __areResourcesNamespaced() {
      return (this.loadResources || []).every((type) => {
        const schema = this.$store.getters['cluster/schemaFor'](type);

        return schema?.attributes?.namespaced;
      });
    },

    /**
     * Are there too many core list resources to show in the list?
     */
    __areResourcesTooMany() {
      const count = this.__getCountForResources(this.loadResources);

      return count > this.perfConfig.forceNsFilter.threshold;
    },

  },

  methods: {
    log(...args) { // TODO: RC PR
      console.warn(this.$options.name, ...args);
    }
  }
};
