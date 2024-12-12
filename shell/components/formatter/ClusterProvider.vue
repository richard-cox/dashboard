<script>
import { MANAGEMENT, FLEET } from 'config/types';

export default {
  props: {
    row: {
      type:     Object,
      required: true
    },
  },

  computed: {
    // derp() {
    //   return this.$store.getters['management/byId'](MANAGEMENT.CLUSTER, row.mgmtClusterId);
    // },

    // machineProvider() {
    //   return this.row.machineProvider;
    // }

    // hasFromGetter() {
    //   return !!this.row.mgmt;
    // },

    // hasFromReactiveProperty() {
    //   return !!this.row.reactiveMgmt.value?.id
    // },

    // hasFromStore() {
    //   return !!this.$store.getters['management/byId'](MANAGEMENT.CLUSTER, this.row.mgmtClusterId);
    // }
  },

  data() {
    return {
      MANAGEMENT,
      FLEET
    }
  }
};
</script>

<template>
  <div>
    <template v-if="row.machineProvider">
      <span v-if="row.isHarvester && row.mgmt && row.mgmt.isReady && !row.hasError">
        <a
          v-if="row.mgmt.isReady && !row.hasError"
          role="button"
          @click="row.goToHarvesterCluster()"
        >
          {{ row.machineProviderDisplay }}
        </a>
      </span>
      <span v-else>
        {{ row.machineProviderDisplay }}
      </span>
    </template>
    <template v-else-if="row.isImported">
      {{ t('cluster.provider.imported') }}
    </template>
    <template v-else-if="row.isCustom">
      {{ t('cluster.provider.custom') }}
    </template>
    <div class="text-muted">
      {{ row.provisionerDisplay }}
    </div>
    <div>
      <!-- hasFromGetter: {{ row.mgmt?.id }}<br>
      hasFromReactiveProperty: {{ row.reactiveMgmt?.value?.id }}<br>
      hasFromStore: {{ $store.getters['management/byId'](MANAGEMENT.CLUSTER, row.mgmtClusterId)?.id }}<br>
      <br>
      hasMachineProvider: {{row.machineProvider}}<br> -->
      <br>
      hasFleetCluster: {{ $store.getters['management/byId'](FLEET.CLUSTER, 'fleet-local/local') }}<br>

      <!-- 
      hasFleetCluster: {{ row.fleetCluster }}<br>
      hasFromReactiveProperty: {{ row.reactiveFleetCluster?.value }}<br>
      fleetGen: {{ $store.getters['management/generation'](FLEET.CLUSTER) }}<br>
      fleetGen: {{ row.fleetGeneration }}<br>
    -->
    
    </div>
  </div>
</template>
