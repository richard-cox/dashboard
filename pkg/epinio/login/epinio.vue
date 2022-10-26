<script>
import Login from '@shell/mixins/login';

export default {
  mixins: [Login],

  async fetch() {
    const res = await this.$store.dispatch('management/request', { url: '/dex/redirectUrl' });

    this.redirectUrl = res.redirectUrl;
  },

  data() {
    return { redirectUrl: null };
  },

  methods: {
    login() {
      this.$store.dispatch('auth/redirectTo', { provider: this.name, redirectUrl: this.redirectUrl });
    },
  },
};
</script>

<template>
  <div class="text-center">
    <button ref="btn" class="btn bg-primary" style="font-size: 18px;" :disabled="$fetchState.pending" @click="login">
      {{ t('login.loginWithProvider', {provider: displayName}) }}
    </button>
  </div>
</template>
