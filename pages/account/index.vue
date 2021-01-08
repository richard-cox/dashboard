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
    <h1>Accounts and API Keys</h1>
    <section>
      <h2>Account</h2>
      <div class="col mt-10">
        {{ principal.created }}
        {{ principal.createdTS }}
        {{ principal.description }}
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
      <PromptChangePassword ref="promptChangePassword" />
      <!-- <div v-if="canChangePassword" class="account">
      <h4 v-t="'prefs.account.label'" />
      <div class="account__details">
        <div class="col mt-10">
          <div><t k="prefs.account.name" />: {{ principal.name }}</div>
          <div><t k="prefs.account.username" />: {{ principal.loginName }}</div>
        </div>
        <button
          type="button"
          class="btn role-secondary"
          @click="$refs.promptChangePassword.show(true)"
        >
          {{ t("prefs.account.change") }}
        </button>
      </div>
      <hr />
    </div> -->
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
</style>
