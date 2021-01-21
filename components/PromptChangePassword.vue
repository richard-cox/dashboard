<script>
import { mapGetters } from 'vuex';
import ChangePassword from '@/components/form/ChangePassword';
import Card from '@/components/Card';
import AsyncButton from '@/components/AsyncButton';

export default {
  components: {
    Card, AsyncButton, ChangePassword
  },
  data(ctx) {
    return {};
  },
  computed:   {
    ...mapGetters({ t: 'i18n/t' }),

    canSubmit() {
      return this.$refs?.changePassword?.canSubmit;
    }

  },
  methods: {
    show(show) {
      if (show) {
        // this.reset();
        this.$modal.show('password-modal');
      } else {
        this.$modal.hide('password-modal');
      }
    },
    async submit() {
      await this.$refs.changePassword.submit();
      this.show(false);
    }
  },
};
</script>

<template>
  <modal
    class="change-password-modal"
    name="password-modal"
    :width="500"
    :height="410"
  >
    <Card class="prompt-password" :show-highlight-border="false">
      <h4 slot="title" class="text-default-text">
        {{ t("accountAndKeys.account.changePassword.title") }}
      </h4>
      <ChangePassword ref="changePassword" slot="body" />
      <template #actions>
        <button class="btn role-secondary" @click="show(false)">
          {{ t("accountAndKeys.account.changePassword.cancel") }}
        </button>
        <AsyncButton mode="apply" class="btn bg-error ml-10" :disabled="!canSubmit" @click="submit" />
      </template>
    </Card>
  </modal>
</template>

<style lang="scss" scoped>
    .change-password-modal {
      ::v-deep .v--modal {
        display: flex;

        .card-wrap {
          display: flex;
          flex-direction: column;

          .card-body {
            flex: 1;
            justify-content: start;
            & > div {
              flex: 1;
              display: flex;
            }
          }

          .card-actions {
            display: flex;
            justify-content: flex-end;
            width: 100%;
          }
        }
      }
    }

    .prompt-password {
      flex: 1;
      display: flex;
    }

</style>
