<script>
import GlobalRoleBindings from '@/components/GlobalRoleBindings.vue';

export default {
  components: { GlobalRoleBindings },

  props: {
    value: {
      type:     Object,
      required: true,
    },
  },

  async fetch() {
    // await this.$store.dispatch('management/findAll', { type: FLEET.CLUSTER });
    // await this.$store.dispatch('management/findAll', { type: FLEET.CLUSTER_GROUP });
  },
};
</script>

<template>
  <div>
    <GlobalRoleBindings :principal-id="value.id" :mode="mode" />
  </div>
</template>

<style lang="scss" scoped>
</style>
