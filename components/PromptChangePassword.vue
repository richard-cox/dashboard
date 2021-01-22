<script>
import { mapGetters } from 'vuex';
import ChangePassword from '@/components/form/ChangePassword';
import Card from '@/components/Card';
import AsyncButton from '@/components/AsyncButton';

export default {
  components: {
    Card, AsyncButton, ChangePassword
  },
  data() {
    return { valid: false };
  },
  computed:   { ...mapGetters({ t: 'i18n/t' }) },
  methods:  {
    show(show) {
      if (show) {
        this.$modal.show('password-modal');
      } else {
        this.$modal.hide('password-modal');
      }
    },
    async submit(buttonCb) {
      try {
        await this.$refs.changePassword.submit(); buttonCb(true);
        this.show(false);
        buttonCb(true);
      } catch (err) {
        buttonCb(false);
      }
    }
  },
};
</script>

<template>
  <modal
    class="change-password-modal"
    name="password-modal"
    :width="500"
    :height="445"
  >
    <Card class="prompt-password" :show-highlight-border="false">
      <h4 slot="title" class="text-default-text">
        {{ t("accountAndKeys.account.changePassword.title") }}
      </h4>
      <div slot="body">
        <form @submit.prevent>
          <!-- <input type="hidden" name="username" autocomplete="username" :value="'ab'">
          <input type="hidden" name="password" autocomplete="password" :value="'ab'"> -->
          <ChangePassword ref="changePassword" @valid="valid = $event" />
        </form>
      </div>

      <template #actions>
        <!-- Buttons moved to body to be included in form -->
        <button class="btn role-secondary" @click="show(false)">
          {{ t("accountAndKeys.account.changePassword.cancel") }}
        </button>
        <AsyncButton
          type="submit"
          mode="apply"
          class="btn bg-error ml-10"
          :disabled="!valid"
          value="LOGIN"
          @click="submit"
        />
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
      form {
        flex: 1;
      }
    }

</style>
