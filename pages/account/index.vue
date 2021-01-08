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
    <h1>Account and API Keys</h1>
    <section class="account">
      <h2>Account</h2>
      <div class="content">
        <div class="col mt-10">
          <div><t k="prefs.account.name" />: {{ principal.name }}</div>
          <div><t k="prefs.account.username" />: {{ principal.loginName }}</div>
        </div>
        <button
          v-if="canChangePassword"
          type="button"
          class="btn role-secondary"
          @click="$refs.promptChangePassword.show(true)"
        >
          {{ t("prefs.account.change") }}
        </button>
      </div>
      <PromptChangePassword ref="promptChangePassword" />
    </section>

    <section>
      <h2>API Keys</h2>
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
