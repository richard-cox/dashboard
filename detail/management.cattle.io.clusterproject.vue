<script>
import CreateEditView from '@/mixins/create-edit-view';
import Tab from '@/components/Tabbed/Tab';
import ResourceTabs from '@/components/form/ResourceTabs';
import SortableTable from '@/components/SortableTable';
import Loading from '@/components/Loading';
import { MANAGEMENT, NAMESPACE } from '@/config/types';

export default {
  components: {
    Tab,
    ResourceTabs,
    SortableTable,
    Loading
  },
  mixins:     [
    CreateEditView
  ],
  async fetch() {
    // this.value = await this.$store.dispatch('management/byId', { type: MANAGEMENT.PROJECT, id:  })
    // Upfront fetch
    // await this.$store.dispatch('management/findAll', { type: MANAGEMENT.ROLE_TEMPLATE });

    // this.data.gp = await this.fetchGlobalRoleBindings(this.value.id);

    // this.data.cr = await this.fetchClusterRoles(this.value.id);

    // this.data.pr = await this.fetchProjectRoles(this.value.id);
  },
  data() {
    // const role = {
    //   name:     'role',
    //   labelKey: 'user.detail.generic.tableHeaders.role',
    //   value:    'roleTemplate.displayName',
    //   sort:     'roleTemplate.displayName',
    // };
    // const since = {
    //   name:          'since',
    //   labelKey:      'user.detail.generic.tableHeaders.granted',
    //   value:         'metadata.creationTimestamp',
    //   sort:          'metadata.creationTimestamp:desc',
    //   search:        false,
    //   formatter:     'LiveDate',
    //   formatterOpts: { addSuffix: true },
    //   width:         '20%',
    // };
    const nsSchema = this.$store.getters['cluster/schemaFor'](NAMESPACE);

    return { namespaceHeaders: this.$store.getters['type-map/headersFor'](nsSchema) };
  },
  methods: {}

};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <!-- TODO: RC w action for remove. no other actions? for to edit? -->
    <!-- "
    mangleActionResources
          key-field="id"
          :table-actions="false" -->
    <ResourceTabs v-model="value" :mode="mode">
      <Tab label-key="tableHeaders.namespaces" name="cr" :weight="2">
        <SortableTable
          :rows="value.namespaces"
          :headers="namespaceHeaders"
          key-field="id"
          :table-actions="false"
          :row-actions="false"
          :search="true"
        />
      </Tab>
    </ResourceTabs>
  </div>
</template>

<style lang="scss" scoped>
</style>
