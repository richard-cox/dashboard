<script>
import SortableTable from '@/components/SortableTable';
import Loading from '@/components/Loading';
import { MANAGEMENT, NORMAN } from '@/config/types';

// TODO: RC Q Should this be a custom list showing selected principals... or all principals... what about groups?
// TODO: RC Group Roles & Bindings vs Cluster roles & bindings

export default {
  components: { SortableTable, Loading },
  async fetch() {
    await this.updateRows();
  },
  data() {
    return {
      schema:             null, // this.$store.getters['norman/schemaFor'](NORMAN.PRINCIPLE)// TODO: RC Q confirm, no schema's for norman?
      headers:            this.$store.getters['type-map/headersFor']({ id: NORMAN.PRINCIPAL }),
      // Provided by fetch & updateRows later
      principals:         null,
      globalRoleBindings: null,
      rows:               [],
    };
  },
  methods: {
    async updatePrincipals() {
      // TODO: RC Can this be filtered by principalType === 'group'?
      this.principals = await this.$store.dispatch('rancher/findAll', {
        type: NORMAN.PRINCIPLE,
        opt:  { url: '/v3/principals' }
      });
    },
    async updateGlobalRoleBindings(force) {
      // TODO: RC Can this be filtered by only the principals we're interested in... as this could be huge?
      // aka all entries where groupPrincipalName is one in string[],
      this.globalRoleBindings = await this.$store.dispatch('management/findAll', {
        type: MANAGEMENT.GLOBAL_ROLE_BINDINGS,
        opt:  { force }
      });
    },
    async updateRows() {
      if (!this.principals) {
        await this.updatePrincipals();
      }
      if (!this.globalRoleBindings) {
        await this.updateGlobalRoleBindings();
      }

      // Up front fetch all global roles, in stead of individually when needed (results in many duplicated requests)
      await this.$store.dispatch('management/findAll', { type: MANAGEMENT.GLOBAL_ROLE });

      // TODO: Q does this always redraw... and as such recreate (RE refresh group memberships)
      this.rows = this.principals.filter((principal) => {
        return principal.principalType === 'group' && this.principalHasGlobalRoleBinding(this.globalRoleBindings, principal);
      });
    },
    principalHasGlobalRoleBinding(globalRoleBindings, principal) {
      return !!globalRoleBindings.find(globalRoleBinding => globalRoleBinding.groupPrincipalName === principal.id);
    },
    async refreshGroupMemberships() {
      // TODO: RC Double check ... just need to refresh global role bindings?
      await this.updateGlobalRoleBindings(true);
      await this.updateRows();
    },
  }
};

</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <header>
      <div class="title">
        <h1 class="m-0">
          {{ t("authGroups.title") }}
        </h1>
      </div>
      <div class="actions-container">
        <div class="actions">
          <span
            class="btn role-primary"
            @click="refreshGroupMemberships()"
          >
            {{ t("authGroups.actions.refresh") }}
          </span>
          <n-link
            v-if="rows.length > 0"
            :to="'groups/assign'"
            class="btn role-primary"
          >
            {{ t("authGroups.actions.assignRoles") }}
          </n-link>
        </div>
      </div>
    </header>
    <!-- TODO: RC Q Row actions ... currently only 'view in api'... needs to be edit & delete -->
    <!-- Create model for steve principals... what if shown elsehwere? -->
    <SortableTable
      :rows="rows"
      :table-actions="false"
      :headers="headers"
      :row-actions="true"
      key-field="id"
      default-sort-by="group-name"
      :paged="true"
    />
  </div>
</template>

<style lang="scss" scoped>
  .actions {
    display: flex;
    justify-content: flex-end;
    align-items:center;

    .btn {
      margin-left: 10px;
    }
  }
</style>
