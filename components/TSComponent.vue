<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';

export interface Value {
    label: String;
}

@Component
class TSComponent extends Vue {
    @Prop(Object) value: Value;
}

export default TSComponent;

</script>

<template>
  <div>{{ value.label }}</div>
</template>
