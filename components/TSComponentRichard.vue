<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';
import storeAccessor from '~/utils/store-accessor';
import { COUNT, NAMESPACE } from '~/config/types';
import { ProxiedResource } from '~/plugins/steve/resource.types';
import { NamespaceModel, KubeNamespace, DashboardNamespaceType } from '~/models/namespace';
import i18n from '~/typed-store/i18n';

export interface Value {
  label: String;
}

@Component
class TSComponentRichard extends Vue {
  @Prop({ default: { label: '' } }) value: Value;

  counts: any;
  namespace: any;
  namespaceTyped: ProxiedResource<NamespaceModel, KubeNamespace>;

  // TODO: RC Cannot access in template without exposing. If this stays it should be in a mixin/super
  private storeAccessor = storeAccessor;
  private a = i18n;

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
    this.namespaceTyped = this.namespace as DashboardNamespaceType;
    console.log(this.namespaceTyped.isSystem);
    console.log(this.namespaceTyped.availableActions);
  }

  private initStore() {
    // DemoVuexModuleDecorator currently does not work now for some reason...
    console.log('storeAccessor.demo: ', !!storeAccessor.demo);
    console.log(Object.keys(storeAccessor.demo));
    console.log('storeAccessor.demo.axles: ', !!storeAccessor.demo.axles);
    console.log('storeAccessor.demo.incrWheels: ', !!storeAccessor.demo.incrWheels);
    console.log('storeAccessor.demo.axles: ', storeAccessor.demo.axles);
    storeAccessor.demo.incrWheels(2);
    console.log(storeAccessor.demo);

    // This works fine
    console.log(`storeAccessor.i18n.t('generic.add'): `, storeAccessor.i18n.t('generic.add'));
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
    <tr>
      <td>storeAccessor.demo.axles</td>
      <td>
        {{ storeAccessor.demo.axles }} <button class="btn bg-primary" @click="storeAccessor.demo.incrWheels(2)">
          demo.incrWheels
        </button>
      </td>
    </tr>
  </table>
</template>

<style lang="scss" scoped>
th {
  text-align: left;
}
</style>
