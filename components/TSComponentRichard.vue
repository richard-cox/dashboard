<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';
import acessor from '~/utils/store-accessor';
import { COUNT, NAMESPACE } from '~/config/types';
import { ProxiedResource } from '~/plugins/steve/resource.types';
import { NamespaceModel, KubeNamespace } from '~/models/namespace';

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

    this.initStore();
  }

  private initModel() {
    this.counts = this.$store.getters[`cluster/all`](COUNT)[0].counts[NAMESPACE];
    this.namespace = this.$store.getters['cluster/byId'](NAMESPACE, 'ds4-4-1-charts');
    this.namespaceTyped = this.namespace as ProxiedResource<NamespaceModel, KubeNamespace>;
  }

  private initStore() {
    console.log('acessor.abc: ', !!acessor.demo);
    console.log('acessor.abc.axles: ', !!acessor.demo.axles);
    console.log('acessor.abc.incrWheels: ', !!acessor.demo.incrWheels);
    console.log('acessor.abc.axles: ', acessor.demo.axles);
    // console.log('this.$emit: ', this.$emit);
    acessor.demo.incrWheels(2);
    console.log(acessor.demo.axles);
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
