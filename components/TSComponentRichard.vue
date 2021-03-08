<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';
import { COUNT, NAMESPACE } from '~/config/types';
import { ProxiedResource } from '~/plugins/steve/resource.types';
import { NamespaceModel, KubeNamespace } from '~/types/namespace';

export interface Value {
  label: String;
}

@Component
class TSComponentRichard extends Vue {
  @Prop({ default: { label: '' } }) value: Value;

  counts: any;
  namespace: any;
  namespaceTyped: ProxiedResource<NamespaceModel, KubeNamespace>;

  constructor() {
    super();

    // Linting Errors
    // const a = '';
    // console.log('HELLO');

    this.initModel();

    console.log(Object.keys(this.$accessor));
    console.log(Object.keys(this.$accessor['type-map']));
    console.log(this.$accessor.typedVuexTSStore.count);
    console.log(this.$accessor.typedVuexTSStore.evenMore);
    console.log(this.$accessor.typedVuexTSStore.nameAndMore);
    this.$accessor.typedVuexTSStore.SET_COUNT(10000);
    console.log(this.$accessor.typedVuexTSStore.count);

    console.log(this.$accessor.i18n.t('generic.add'));
    // this.$accessor.
  }

  $fetch() {
    return {};
  }

  private initModel() {
    this.counts = this.$store.getters[`cluster/all`](COUNT)[0].counts[NAMESPACE];
    this.namespace = this.$store.getters['cluster/byId'](NAMESPACE, 'ds4-4-1-charts');
    this.namespaceTyped = this.namespace as ProxiedResource<NamespaceModel, KubeNamespace>;
  }
}

export default TSComponentRichard;
</script>

<template>
  <table>
    <tr>
      <th>Code</th>
      <th>Output</th>
    </tr>
    <tr>
      <td>this.$store.getters[`cluster/all`](COUNT)[0].counts[NAMESPACE]</td>
      <td>{{ counts }}</td>
    </tr>
    <tr>
      <td>this.$store.getters['cluster/byId'](NAMESPACE, 'ds4-4-1-charts')</td>
      <td>{{ namespace }}</td>
    </tr>
    <tr>
      <td>namespace.nameDisplay</td>
      <td>{{ namespace.nameDisplay }}</td>
    </tr>
    <tr>
      <td>namespace.injectionEnabled</td>
      <td>{{ namespace.injectionEnabled }}111</td>
    </tr>
    <tr>
      <td>namespaceTyped.nameDisplay</td>
      <td>{{ namespaceTyped.nameDisplay }}</td>
    </tr>
    <tr>
      <td>namespaceTyped.injectionEnabled</td>
      <td>{{ namespaceTyped.injectionEnabled }}</td>
    </tr>
  </table>
</template>

<style lang="scss" scoped>
th {
  text-align: left;
}
</style>
