<script>
import PromptChangePassword from '@/components/PromptChangePassword';
import { NORMAN } from '@/config/types';

export default {
  components: { PromptChangePassword },
  computed:   {
    principal() {
      return this.$store.getters['rancher/byId'](NORMAN.PRINCIPAL, this.$store.getters['auth/principalId']) || {};
    },
    canChangePassword() {
      return this.$store.getters['auth/enabled'] && !!this.principal.loginName;
    },
  }
};
</script>

<template>
  <div>
    <h1 v-t="'accountAndKeys.title'" />
    <section class="account">
      <h4 v-t="'accountAndKeys.account.title'" />
      <div class="content">
        <div class="col mt-10">
          <div><t k="accountAndKeys.account.name" />: {{ principal.name }}</div>
          <div><t k="accountAndKeys.account.username" />: {{ principal.loginName }}</div>
        </div>
        <button
          v-if="canChangePassword"
          type="button"
          class="btn role-secondary"
          @click="$refs.promptChangePassword.show(true)"
        >
          {{ t("accountAndKeys.account.change") }}
        </button>
      </div>
      <PromptChangePassword ref="promptChangePassword" />
    </section>

    <section>
      <h4 v-t="'accountAndKeys.keys.title'" />
    </section>
  </div>
</template>

<style lang='scss' scoped>
  section {
    margin-bottom: 10px;
  }

  .account {
    .content {
      display: flex;
    }
  }
</style>
