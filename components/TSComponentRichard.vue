
<script lang="ts">
// eslint-disable no-console
import { Component, Vue, Prop, Watch } from 'nuxt-property-decorator';
import { COUNT, NAMESPACE } from '~/config/types';
import { ProxiedResource } from '~/plugins/steve/resource.types';
import { IDashboardNamespace, RancherNamespace } from '~/models/namespace';

interface Value {
  label: String;
}


// Component.registerHooks(['fetch']);

// eslint-disable-next-line no-use-before-define
@Component<TSComponentRichard>({
  // Not called
  async fetch(ctx) {
    console.error('fetch', this.$isServer);
    // testString auto completes
    console.error('this.testString: ', this.testString);
    // namespace auto completes
    await this.$store.dispatch('cluster/find', { type: NAMESPACE, id: 'ds4-4-1-charts' });
  },
  // asyndDate is only for page components
  // async asyncData(ctx) {
  //   return {
  //     test:      true,
  //   };
  // },
})
class TSComponentRichard extends Vue {
  @Prop({ default: { label: '' } }) value: Value;

  get computedValue() {
    return `computed-${ this.value }`;
  }

  get computedNamespace() {
    return this.namespace || {}
  }

  // @Watch('namespace')
  // onPropertyChanged() {
  //   // value: string, oldValue: string
  //   console.log('namespace changed');
  // }

  private counts: any;
  private namespace: any;
  private namespaceTyped: ProxiedResource<IDashboardNamespace, RancherNamespace>;

  private readonly testString = 'this is a string';

  created() {
    console.error('this.$fetchState', this.$fetchState)
    this.counts = this.$store.getters[`cluster/all`](COUNT)[0].counts[
      NAMESPACE
    ];
    this.namespace = this.$store.getters['cluster/byId'](
      NAMESPACE,
      'ds4-4-1-charts'
    );
    this.namespaceTyped = this.namespace as ProxiedResource<
      IDashboardNamespace,
      RancherNamespace
    >;

    const a = '';
  }
}

export default TSComponentRichard;
</script>

<template>
  <!-- $fetchState is undefined -->
  <!-- <table v-if="!$fetchState.pending"> -->
  <table>
    <tr>
      <th>Source</th>
      <th>Outcome</th>
    </tr>
    <tr>
      <td>this.$store.getters[`cluster/all`](COUNT)[0].counts[NAMESPACE]</td>
      <td>{{ counts }}</td>
    </tr>
    <tr v-if="namespace">
      <td>this.$store.getters['cluster/byId'](NAMESPACE, 'ds4-4-1-charts')</td>
      <td>{{ namespace }}</td>
    </tr>
     <tr v-if="computedNamespace">
      <td>namespace.nameDisplay</td>
      <td>{{ computedNamespace.nameDisplay }}</td>
    </tr> 
    <tr>
      <td>namespace.projectNameSort</td>
      <td>{{ namespace.istioInstalled }}</td>
    </tr>
    <tr>
      <td>namespaceTyped.nameDisplay</td>
      <td>{{ namespaceTyped.nameDisplay }}</td>
    </tr>
    <tr>
      <td>namespaceTyped.projectNameSort</td>
      <td>{{ namespaceTyped.istioInstalled }}</td>
    </tr> 
  </table>
</template>

<style lang="scss" scoped>
th {
  text-align: left;
}
</style>
