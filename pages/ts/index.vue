<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import TSComponent from '@/components/TSComponent.vue';

const Component = defineComponent({ components: { TSComponent } });

export default Component;
</script>

<template>
  <TSComponent :value="{label: 'interfaces'}" />
</template>
