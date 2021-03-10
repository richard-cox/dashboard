<script>
import CreateEditView from '@/mixins/create-edit-view';
import CruResource from '@/components/CruResource';
import Labels from '@/components/form/Labels';
import Loading from '@/components/Loading';
import NameNsDescription from '@/components/form/NameNsDescription';
import Tabbed from '@/components/Tabbed';
import Tab from '@/components/Tabbed/Tab';
import ArrayList from '@/components/form/ArrayList';
import SelectPrincipal from '@/components/auth/SelectPrincipal';
import { MANAGEMENT } from '@/config/types';

// TODO: RC i10n

export default {
  name: 'CruWorkspace',

  components: {
    CruResource,
    Labels,
    Loading,
    NameNsDescription,
    Tabbed,
    Tab,
    ArrayList,
    SelectPrincipal
  },

  mixins: [CreateEditView],

  async fetch() {
    // TODO: RC
    this.members.projectTemplates = await this.$store.dispatch('management/findAll', { type: MANAGEMENT.ROLE_TEMPLATE });
  },

  data() {
    return {
      members:         {
        selected:         [],
        projectTemplates: []
      },
      // TODO: RC
      defaultAddValue: { hello: 'world' }
    };
  },

  computed: {},

  methods: {
    addPrincipal(e) {
      console.log(e);
    },
  }
};
</script>

<template>
  <!-- // TODO: RC edit as yaml button shown -->
  <Loading v-if="$fetchState.pending" />
  <CruResource
    v-else
    :done-route="doneRoute"
    :mode="mode"
    :resource="value"
    :subtypes="[]"
    :validation-passed="true"
    :errors="errors"
    @error="e=>errors = e"
    @finish="save"
    @cancel="done"
  >
    <NameNsDescription v-model="value" :mode="mode" :namespaced="false" />

    <Tabbed :side-tabs="true" default-tab="members">
      <Tab name="members" label-key="project.edit.tabs.members.label" :weight="4">
        <div class="members">
          <span>
            Configure who has access to the resources in this project and what permissions they have
          </span>
          <ArrayList
            key="allowedPrincipalIds"
            v-model="members.selected"
            :mode="mode"
            :protip="false"
            :show-header="true"
            :add-label="t('project.edit.tabs.members.add')"
            :default-add-value="defaultAddValue"
          >
            <template v-slot:column-headers>
              <div class="box">
                <div class="member">
                  Member
                </div>
                <div class="role">
                  Role
                </div>
                <div class="remove">
                </div>
              </div>
            </template>
            <template v-slot:columns="scope">
              <!-- TODO: RC if i === 0 it should be... signed in user who will be cluster owner? also row should not be removable-->
              <!-- { "i": 0, "rows": [ { "value": { "hello": "world" } } ], "row": { "value": { "hello": "world" } }, "mode": "create", "isView": false } -->
              <div class="member">
                <!-- TODO: RC ensure local users can be selected -->
                <SelectPrincipal :mode="mode" :retain-selection="true" @add="addPrincipal" />
                <!-- if scope.i === 1 <Principal :key="option.label" :value="option.label" :use-muted="false" /> -->
              </div>
              <div class="role">
                <Select
                  :mode="mode"
                  :value="scope.row.role"
                  :options="members.projectTemplates"
                />
              </div>
            </template>
          </ArrayList>
        </div>
      </Tab>
      <Tab name="quotes" label-key="project.edit.tabs.quotes">
        Configure how much of the resources the project can consume
      </Tab>
      <Tab name="limits" label-key="project.edit.tabs.limits">
        Configure how much of the resources the container can consume by default
      </Tab>
      <Tab name="labels" label-key="generic.labelsAndAnnotations">
        Configure labels and annotations for the project
        <Labels v-model="value" :mode="mode" />
      </Tab>
    </Tabbed>
  </CruResource>
</template>

<style lang="scss" scoped>

.members {
  ::v-deep .box {
    display: grid;
    grid-template-columns: 1fr 1fr 100px;
    column-gap: 1.75%;
    align-items: center;
    margin-bottom: 10px;

    .member, .role {
      height: 100%;
    }
  }
  // .box {
  //   display: flex;
  //   .member, .role {
  //     flex: 1;
  //   }
  // }
}
</style>
