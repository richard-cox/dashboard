<script>
import ResourceList from '@/components/ResourceList';
import { AS, MODE, _EDIT, _UNFLAG } from '@/config/query-params';
import { NORMAN } from '@/config/types';
// import AsyncButton from '@/components/AsyncButton';

export default {
  // components: { AsyncButton },
  mixins:     [
    ResourceList
  ],
  async fetch() {
    await this.updateRows();
  },
  data() {
    return {};
  },
  methods: {
    async refreshGroupMemberships() {
    // TODO: RC BUTTONS use async button to show state
      try {
      // TODO: RC BUTTONS test - See ./ui/lib/global-admin/addon/security/accounts/groups/controller.js
        await this.$store.dispatch('rancher/request', {
          url:           '/v3/users?action=refreshauthprovideraccess',
          method:        'post',
          data:          { },
        });

        const spoofed = await this.$store.dispatch(`rancher/create`, { type: NORMAN.SPOOFED.GROUP_PRINCIPAL });

        await spoofed.updateList();

      // TODO: RC How does this update the lists associated with this type??
      } catch (error) {
        this.$store.dispatch('growl/fromError', { title: 'Error refreshing group memberships', error }, { root: true });
      }
    },
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <Masthead
      :schema="schema"
      :resource="resource"
    >
      <template slot="extraActions">
        <!-- Specific 'Refresh group memberships' and create with custom 'Add User' text buttons will go here -->
        <!-- <AsyncButton />
        <n-link
          :to="''"
          class="btn role-primary"
        >
          Test Link
        </n-link> -->
        <span
          class="btn role-primary"
          @click="refreshGroupMemberships()"
        >
          {{ t("authGroups.actions.refresh") }}
        </span>
        <n-link
          v-if="rows.length > 0"
          :to="`group.principal/assign-edit?${MODE}=${_EDIT}`"
          class="btn role-primary"
        >
          {{ t("authGroups.actions.assignRoles") }}
        </n-link>
      </template>
    </Masthead>

    <ResourceTable :schema="schema" :rows="rows" :group-by="groupBy" />
  </div>
</template>

<style lang="scss">
</style>
