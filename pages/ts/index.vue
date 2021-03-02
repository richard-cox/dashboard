<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import TSComponent from '@/components/TSComponent.vue';
import TSComponentRichard from '@/components/TSComponentRichard.vue';

const Component = defineComponent({ components: { TSComponent, TSComponentRichard } });

export default Component;
</script>

<template>
  <dir>
    <h1>Playground (Cody)</h1>
    <TSComponent :value="{label: 'interfaces'}" />
    <h1>Playground (Richard)</h1>
    <TSComponentRichard :value="{label: 'interfaces'}" />
  </dir>
</template>
