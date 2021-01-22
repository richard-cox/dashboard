<script>
import { mapGetters } from 'vuex';
import Banner from '@/components/Banner';
import Checkbox from '@/components/form/Checkbox';
import Password from '@/components/form/Password';
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
        this.errorMessages = [];
        this.validate();
      }
    },

    passwordCurrent: {
      get() {
        return this.form.currentP;
      },

      set(p) {
        this.form.currentP = p;
        this.validate();
      }
    },

    passwordNew: {
      get() {
        return this.form.newP;
      },

      set(p) {
        this.form.newP = p;
        this.validate();
      }
    },

    passwordConfirm: {
      get() {
        return this.form.confirmP;
      },

      set(p) {
        this.form.confirmP = p;
        this.validate();
      }
    },

    principal() {
      return this.$store.getters['rancher/byId'](NORMAN.PRINCIPAL, this.$store.getters['auth/principalId']) || {};
    },
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
      this.validate();
    },
    passwordsMatch() {
      const match = this.passwordNew === this.passwordConfirm;

      this.errorMessages = this.canShowMissmatchedPassword && !match ? [this.t('accountAndKeys.account.changePassword.errors.missmatchedPassword')] : [];

      return match;
    },
    validate() {
      this.$emit('valid', this.isRandomGenerated ? !!this.passwordCurrent : this.passwordsMatch() && !!this.passwordCurrent && this.passwordNew);
    },
    async submit() {
      await this.changePassword();
      if (this.form.deleteKeys) { // TODO: RC _mode if create
        await this.deleteKeys();
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
    <div class="form">
      <div class="fields">
        <Checkbox v-model="form.deleteKeys" :label="t('accountAndKeys.account.changePassword.keys')" class="mt-10" />
        <input id="username" type="hidden" name="username" autocomplete="username" :value="principal.loginName">
        <Password v-model="passwordCurrent" class="mt-10" name="current-password" autocomplete="current-password" :label="t('accountAndKeys.account.changePassword.currentPassword')"></Password>
        <Password
          v-if="isRandomGenerated"
          v-model="form.genP"
          name="password"
          autocomplete="new-password"
          class="mt-10"
          :is-random="true"
          :label="t('accountAndKeys.account.changePassword.randomGen.generated')"
        />
        <div v-else class="userGen">
          <Password v-model="passwordNew" class="mt-10" name="password" autocomplete="new-password" :label="t('accountAndKeys.account.changePassword.userGen.newPassword')" />
          <Password
            v-model="passwordConfirm"
            class="mt-10"
            name="password-confirm"
            autocomplete="new-password"
            :label="t('accountAndKeys.account.changePassword.userGen.confirmPassword')"
            @blur="passwordConfirmBlurred()"
          />
        </div>
      </div>
      <Checkbox v-model="isRandomGenerated" :label="t('accountAndKeys.account.changePassword.generatePassword')" class="mt-10 type" />
    </div>
    <div v-if="errorMessages && errorMessages.length" class="text-error">
      <Banner v-for="(err, i) in errorMessages" :key="i" color="error" :label="err" class="mb-0" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .change-password {
    display: flex;
    flex-direction: column;

    .form {
      display: flex;
      flex-direction: column;
      .fields{
        height: 215px;

        #username {
          // display: none;
        }
      }
    }

  }

</style>
