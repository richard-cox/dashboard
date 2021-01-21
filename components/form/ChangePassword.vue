<script>
import { mapGetters } from 'vuex';
import ButtonGroup from '@/components/ButtonGroup';
import Banner from '@/components/Banner';
import Checkbox from '@/components/form/Checkbox';
import Password from '@/components/form/Password';
import CopyToClipboard from '@/components/CopyToClipboard.vue';
import { NORMAN } from '@/config/types';

export default {
  components: {
    Checkbox, Banner, Password
  },
  data(ctx) {
    return {
      errorMessages:              [],
      canShowMissmatchedPassword: false,
      pIsRandomGenerated:            false,
      // TODO: RC Remove translations
      // genPasswordOptions:         [{
      //   labelKey: `accountAndKeys.account.changePassword.userPassword`,
      //   value:    true
      // }, {
      //   labelKey: `accountAndKeys.account.changePassword.generatedPassword`,
      //   value:    false
      // }],
      form:                       {
        deleteKeys: false,
        currentP:   '',
        newP:       '',
        genP:       '',
        confirmP:   ''
      }
    };
  },
  computed:   {
    ...mapGetters({ t: 'i18n/t' }),

    isRandomGenerated: {
      get() {
        return this.pIsRandomGenerated;
      },

      set(isRandomGenerated) {
        this.pIsRandomGenerated = isRandomGenerated;
        if (this.isRandomGenerated) {
          this.errorMessages = [];
        } else {
          this.validateNewPassword();
        }
      }
    },

    passwordNew: {
      get() {
        return this.form.newP;
      },

      set(p) {
        this.form.newP = p;
        this.validateNewPassword();
      }
    },

    passwordConfirm: {
      get() {
        return this.form.confirmP;
      },

      set(p) {
        this.form.confirmP = p;
        this.validateNewPassword();
      }
    },

    canSubmit() {
      return !!this.form.currentP && (!this.isRandomGenerated ? this.form.newP && this.form.newP === this.form.confirmP : true);
    }

  },
  methods: {
    created() {
      this.reset();
    },
    reset() {
      // TODO: RC init
      this.isRandomGenerated = false;
      this.canShowMissmatchedPassword = false;
      this.form = {
        ...this.form,
        currentP: '',
        newP:     '',
        confirmP: ''
      };
      this.errorMessages = [];
    },
    passwordConfirmBlurred() {
      this.canShowMissmatchedPassword = true;
      this.validateNewPassword();
    },
    validateNewPassword() {
      this.errorMessages = !!this.form.confirmP && (this.canShowMissmatchedPassword && this.form.newP !== this.form.confirmP) ? [this.t('accountAndKeys.account.changePassword.errors.missmatchedPassword')] : [];
    },
    async submit(buttonCb) {
      try {
        await this.changePassword();
        if (this.form.deleteKeys) { // TODO: RC _mode if create
          await this.deleteKeys();
        }
        buttonCb(true);
      } catch (err) {
        buttonCb(false);
      }
    },
    async changePassword() {
      try {
        await this.$store.dispatch('rancher/collectionAction', {
          type:       NORMAN.USER,
          actionName: 'changepassword',
          body:          {
            currentPassword: this.form.currentP,
            newPassword:     this.isRandomGenerated ? this.form.genP : this.form.newP
          },
        });
      } catch (err) {
        this.errorMessages = [err.message || this.t('accountAndKeys.account.changePassword.errors.failedToChange')];
        throw err;
      }
    },
    async deleteKeys() {
      try {
        const tokens = await this.$store.dispatch('rancher/findAll', {
          type: NORMAN.TOKEN,
          opt:  {
            // Ensure we have any new tokens since last fetched... and that we don't attempt to delete previously deleted tokens
            force: true
          }
        });

        await Promise.all(tokens.reduce((res, token) => {
          if (!token.current) {
            res.push(token.remove());
          }

          return res;
        }, []));
      } catch (err) {
        if (err.message) {
          this.errorMessages = [err.message];
        } else if (err.length > 1) {
          this.errorMessages = [this.t('accountAndKeys.account.changePassword.errors.failedDeleteKeys')];
        } else {
          this.errorMessages = [this.t('accountAndKeys.account.changePassword.errors.failedDeleteKey')];
        }
        throw err;
      }
    },
  },
};
</script>

<template>
  <div class="change-password">
    <form class="mb-10">
      <div class="fields">
        <Checkbox v-model="form.deleteKeys" :label="t('accountAndKeys.account.changePassword.keys')" class="mt-10" />

        <Password v-model="form.currentP" class="mt-10" :label="t('accountAndKeys.account.changePassword.currentPassword')"></Password>
        <Password v-if="isRandomGenerated" v-model="form.genP" class="mt-10" :is-random="true" :label="t('accountAndKeys.account.changePassword.randomGen.generated')" />
        <div v-else class="userGen">
          <Password v-model="passwordNew" class="mt-10" :label="t('accountAndKeys.account.changePassword.userGen.newPassword')" />
          <Password v-model="passwordConfirm" class="mt-10" :label="t('accountAndKeys.account.changePassword.userGen.confirmPassword')" @blur="passwordConfirmBlurred()" />
        </div>
      </div>
      <div class="type">
        <Checkbox v-model="isRandomGenerated" :label="t('accountAndKeys.account.changePassword.generatePassword')" class="mt-10" />
      </div>
    </form>
    <div v-if="errorMessages && errorMessages.length" class="text-error">
      <Banner v-for="(err, i) in errorMessages" :key="i" color="error" :label="err" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .change-password {
    flex: 1;
    display: flex;

    form {
      flex: 1;
      display: flex;
      flex-direction: column;
      .fields {
        flex: 1;
      }
      .userGen {
        flex: 0;
      }
    }

    .text-error {
      min-height: 38px;
    }
  }

</style>
