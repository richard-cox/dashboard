<script>
import ResourceList from '@/components/ResourceList';
import { NORMAN } from '@/config/types';
import AsyncButton from '@/components/AsyncButton';

export default {
  components: { AsyncButton },
  mixins:     [
    ResourceList
  ],
  methods: {
    async refreshGroupMemberships(buttonDone) {
      try {
        await this.$store.dispatch('rancher/request', {
          url:           '/v3/users?action=refreshauthprovideraccess',
          method:        'post',
          data:          { },
        });

        this.rows = await this.$store.dispatch('cluster/findAll', {
          type: NORMAN.SPOOFED.GROUP_PRINCIPAL,
          opt:  { force: true }
        });

        buttonDone(true);
      } catch (err) {
        this.$store.dispatch('growl/fromError', { title: 'Error refreshing group memberships', err }, { root: true });
        buttonDone(false);
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
        <AsyncButton
          mode="refresh"
          :action-label="t('authGroups.actions.refresh')"
          :waiting-label="t('authGroups.actions.refresh')"
          :success-label="t('authGroups.actions.refresh')"
          :error-label="t('authGroups.actions.refresh')"
          @click="refreshGroupMemberships"
        />
        <n-link
          v-if="rows.length > 0"
          :to="`group.principal/assign-edit?mode=edit`"
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
