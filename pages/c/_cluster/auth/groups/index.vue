<script>
import SortableTable from '@/components/SortableTable';
import Loading from '@/components/Loading';
import { NORMAN, RBAC } from '@/config/types';

// TODO: RC Q Should this be a custom list showing selected principals... or all principals... what about groups?
// TODO: RC Group Roles & Bindings vs Cluster roles & bindings

// TODO: RC Move this into list folder, so just list section us used

export default {
  components: { SortableTable, Loading },
  async fetch() {
    await this.updateRows();
  },
  data() {
    return {
      schema:             null, // this.$store.getters['norman/schemaFor'](NORMAN.PRINCIPAL)// TODO: RC Q confirm, no schema's for norman?
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
      // TODO: RC nope QCan this be filtered by principalType === 'group'?
      this.principals = await this.$store.dispatch('rancher/findAll', {
        type: NORMAN.PRINCIPAL, // TODO: RC typo PRINCIPAL
        opt:  { url: '/v3/principals' }
      });
    },
    async updateGlobalRoleBindings(force) {
      // TODO: RC Can this be filtered by only the principals we're interested in... as this could be huge?
      // aka all entries where groupPrincipalName is one in string[],
      this.globalRoleBindings = await this.$store.dispatch('management/findAll', {
        type: RBAC.GLOBAL_ROLE_BINDING,
        opt:  { force: true }
      });
    },
    async updateRows() { // TODO: RC update with computed + test with
      if (!this.principals) {
        await this.updatePrincipals();
      }
      if (!this.globalRoleBindings) {
        await this.updateGlobalRoleBindings();
      }

      // Up front fetch all global roles, in stead of individually when needed (results in many duplicated requests)
      await this.$store.dispatch('management/findAll', { type: RBAC.GLOBAL_ROLE });

      // TODO: CHECK Q does this always redraw... and as such recreate (RE refresh group memberships)
      this.rows = this.principals.filter((principal) => {
        return principal.principalType === 'group' && this.principalHasGlobalRoleBinding(this.globalRoleBindings, principal);
      });
    },
    principalHasGlobalRoleBinding(globalRoleBindings, principal) {
      return !!globalRoleBindings.find(globalRoleBinding => globalRoleBinding.groupPrincipalName === principal.id);
    },
    async refreshGroupMemberships() {
      // TODO: RC FIX - specific api action Q Double check ... just need to refresh global role bindings?
      // TODO: RC use action button to show state
      await this.updateGlobalRoleBindings(true);
      await this.updateRows();
    },
  }
};

/**
 * actions: {
      refreshAllTokens() {
        set(this, 'refreshing', true);        this.globalStore.request({
          url:    '/v3/users?action=refreshauthprovideraccess',
          method: 'POST',
          data:   {}
        }).then(() => {
          const successTitle   = this.intl.t('action.refreshAuthProviderAccess.allSuccess.title');
          const successMessage = this.intl.t('action.refreshAuthProviderAccess.allSuccess.message');          this.growl.success(successTitle, successMessage)
        })
          .catch((err) => {
            set(this, 'errors', [err.message]);
          })
          .finally(() => {
            set(this, 'refreshing', false);
          });
      },
    },
*/

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
            :to="'group.principal/assign-edit'"
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
