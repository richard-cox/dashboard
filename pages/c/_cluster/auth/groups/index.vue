<script>
import SortableTable from '@/components/SortableTable';
import Loading from '@/components/Loading';
import { NORMAN, RBAC } from '@/config/types';

// TODO: RC BUTTONS This file and parent folder can be deleted once buttons moved out

export default {
  components: { SortableTable, Loading },
  async fetch() {
    await this.updateRows();
  },
  data() {
    return {
      schema:             null,
      headers:            this.$store.getters['type-map/headersFor']({ id: NORMAN.PRINCIPAL }),
      // Provided by fetch & updateRows later
      principals:         null,
      globalRoleBindings: null,
      rows:               [],
    };
  },
  computed: {},
  methods:  {
    async updatePrincipals() {
      this.principals = await this.$store.dispatch('rancher/findAll', {
        type: NORMAN.PRINCIPAL,
        opt:  { url: '/v3/principals' }
      });
    },
    async updateGlobalRoleBindings(force) {
      // TODO: RC Q Can this be filtered by only the principals we're interested in... as this could be huge?
      // aka all entries where groupPrincipalName is one in string[],
      this.globalRoleBindings = await this.$store.dispatch('management/findAll', {
        type: RBAC.GLOBAL_ROLE_BINDING,
        opt:  { force }
      });
    },
    async updateRows() { // TODO: RC BUTTONS update with computed + test with
      if (!this.principals) {
        await this.updatePrincipals();
      }
      if (!this.globalRoleBindings) {
        await this.updateGlobalRoleBindings();
      }

      // Up front fetch all global roles, in stead of individually when needed (results in many duplicated requests)
      await this.$store.dispatch('management/findAll', { type: RBAC.GLOBAL_ROLE });

      // TODO: BUTTONS CHECK Q does this always redraw... and as such recreate (RE refresh group memberships)
      this.rows = this.principals.filter((principal) => {
        return principal.principalType === 'group' && this.principalHasGlobalRoleBinding(this.globalRoleBindings, principal);
      });
    },
    principalHasGlobalRoleBinding(globalRoleBindings, principal) {
      return !!globalRoleBindings.find(globalRoleBinding => globalRoleBinding.groupPrincipalName === principal.id);
    },
    async refreshGroupMemberships() {
      // TODO: RC BUTTONS use async button to show state
      try {
        // TODO: RC BUTTONS test - See ./ui/lib/global-admin/addon/security/accounts/groups/controller.js
        await this.$store.dispatch('rancher/request', {
          url:           '/v3/users?action=refreshauthprovideraccess',
          method:        'post',
          // headers:       { 'Content-Type': 'application/json' },
          data:          { },
        });

        await this.updateGlobalRoleBindings(true);
        await this.updateRows();
      } catch (error) {
        this.$store.dispatch('growl/fromError', { title: 'Error refreshing group memberships', error }, { root: true });
      }
    },
  }
};

</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    TO BE REMOVED
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
            :to="'group.principal/assign-edit?select=true&mode=edit'"
            class="btn role-primary"
          >
            {{ t("authGroups.actions.assignRoles") }}
          </n-link>
        </div>
      </div>
    </header>
    <!-- <SortableTable
      :rows="rows"
      :table-actions="false"
      :headers="headers"
      :row-actions="true"
      key-field="id"
      default-sort-by="group-name"
      :paged="true"
    /> -->
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
