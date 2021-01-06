<script>
import { mapGetters } from 'vuex';
import ButtonGroup from '@/components/ButtonGroup';
import Banner from '@/components/Banner';
import Checkbox from '@/components/form/Checkbox';
import Card from '@/components/Card';
import AsyncButton from '@/components/AsyncButton';
import LabeledInput from '@/components/form/LabeledInput';
import { CHARSET, randomStr } from '@/utils/string';
import CopyToClipboard from '@/components/CopyToClipboard.vue';

export default {
  components: {
    ButtonGroup, Checkbox, Card, AsyncButton, LabeledInput, CopyToClipboard, Banner
  },
  data(ctx) {
    return {
      errorMessages:              [],
      canShowMissmatchedPassword: false,
      isUserGenerated:            true,
      genPasswordOptions:         [{
        labelKey: `prefs.account.changePassword.userPassword`,
        value:    true
      }, {
        labelKey: `prefs.account.changePassword.generatedPassword`,
        value:    false
      }],
      form: {
        deleteKeys: false,
        currentP:   null,
        newP:       null,
        genP:       randomStr(16, CHARSET.ALPHA_NUM),
        confirmP:   null
      }
    };
  },
  computed:   {
    ...mapGetters({ t: 'i18n/t' }),

    passwordType: {
      get() {
        return this.isUserGenerated;
      },

      set(isUserGenerated) {
        this.isUserGenerated = isUserGenerated;
        if (isUserGenerated) {
          this.validateNewPassword();
        } else {
          this.errorMessages = [];
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
      return !!this.form.currentP && (this.isUserGenerated ? this.form.newP && this.form.newP === this.form.confirmP : true);
    }

  },
  methods: {
    show(show) {
      if (show) {
        this.reset();
        this.$modal.show('password-modal');
      } else {
        this.$modal.hide('password-modal');
      }
    },
    reset() {
      this.isUserGenerated = true;
      this.canShowMissmatchedPassword = false;
      this.form = {
        ...this.form,
        currentP: null,
        newP:     null,
        confirmP: null
      };
      this.errorMessages = [];
    },
    passwordConfirmBlurred() {
      this.canShowMissmatchedPassword = true;
      this.validateNewPassword();
    },
    validateNewPassword() {
      this.errorMessages = !!this.form.confirmP && (this.canShowMissmatchedPassword && this.form.newP !== this.form.confirmP) ? [this.t('prefs.account.changePassword.errors.missmatchedPassword')] : [];
    },
    submit(buttonCb) {
      return this.changePassword()
        .then(() => this.form.deleteKeys ? this.deleteKeys() : null)
        .then(() => {
          buttonCb(true);
          this.show(false);
        })
        .catch(() => {
          buttonCb(false);
        });
    },
    changePassword() {
      return this.$store.dispatch('rancher/request', {
        url:           '/v3/users?action=changepassword',
        method:        'post',
        headers:       { 'Content-Type': 'application/json' },
        data:          {
          currentPassword: this.form.currentP,
          newPassword:     this.isUserGenerated ? this.form.newP : this.form.genP
        },
      })
        .catch((err) => {
        // TODO: RC Q cannot convert the returned err codes to i18n id's
        //   // no current password: {"baseType":"error","code":"InvalidBodyContent","message":"must specify current password","status":422,"type":"error"}
        //   // invalid current password: {"baseType":"error","code":"InvalidBodyContent","message":"invalid current password","status":422,"type":"error"}
          this.errorMessages = [err.message || this.t('prefs.account.changePassword.errors.failedToChange')];
          throw err;
        });
    },
    deleteKeys() {
      // TODO: RC Q Better way to determin user's tokens?
    //     return dispatch('rancher/findAll', { // Does this cache? if so how is it cleared if processed repeated?
    //   type: 'authConfig',
    //   opt:  { url: `/v3/authConfigs` }
    // }, { root: true });
      return this.$store.dispatch('rancher/request', {
        url:           '/v3/tokens',
        method:        'get',
        headers:       { 'Content-Type': 'application/json' },
      })
        .then((res) => {
          const promises = [];

          (res.data || []).forEach((token) => {
            if (token.current) {
            // Ignore the current session, it will error with `Cannot delete token for current session. Use logout instead`
            // TODO: RC Should we log user out instead or let them keep their current session's token?
            } else {
              promises.push(this.$store.dispatch('rancher/request', {
                url:           `/v3/tokens/${ token.id }`, // TODO: RC Q Should this use the token.links.remove url instead?
                method:        'delete',
                headers:       { 'Content-Type': 'application/json' },
              }));
            }
          });

          return promises;
        })
        .catch((err) => {
          if (err.message) {
            this.errorMessages = [err.message];
          } else if (err.length > 1) {
            this.errorMessages = [this.t('prefs.account.changePassword.errors.failedDeleteKeys')];
          } else {
            this.errorMessages = [this.t('prefs.account.changePassword.errors.failedDeleteKey')];
          }
          throw err;
        });
    },
    generatePassword() {
      this.form.genP = randomStr(16, CHARSET.ALPHA_NUM);
    },
  },
};
</script>

<template>
  <modal
    class="change-password-modal"
    name="password-modal"
    :width="500"
    :height="480"
  >
    <!-- TODO: RC Q Disable global shortcuts whilst modal shows? -->
    <Card class="prompt-password" :show-highlight-border="false">
      <h4 slot="title" class="text-default-text">
        {{ t("prefs.account.changePassword.title") }}
      </h4>
      <div slot="body">
        <form class="mb-10">
          <Checkbox v-model="form.deleteKeys" :label="t('prefs.account.changePassword.keys')" class="mt-10" />
          <LabeledInput
            key="current"
            v-model="form.currentP"
            :label="t('prefs.account.changePassword.currentPassword')"
            :mode="'edit'"
            :min-height="30"
            :required="true"
            type="password"
            class="mt-10"
          />
          <ButtonGroup v-model="passwordType" :options="genPasswordOptions" class="prompt-password__generated mt-10" />

          <div v-if="passwordType" class="userGen">
            <LabeledInput
              key="new"
              v-model="passwordNew"
              :label="t('prefs.account.changePassword.userGen.newPassword')"
              :mode="'edit'"
              :min-height="30"
              :required="true"
              type="password"
              class="mt-10"
            />
            <LabeledInput
              key="confirm"
              v-model="passwordConfirm"
              :label="t('prefs.account.changePassword.userGen.confirmPassword')"
              :mode="'edit'"
              :min-height="30"
              :required="true"
              type="password"
              class="mt-10"
              @blur="passwordConfirmBlurred()"
            />
          </div>
          <div v-else class="prompt-password__randomGen mt-10">
            <div class="prompt-password__randomGen__label">
              <LabeledInput
                key="gen"
                v-model="form.genP"
                :label="t('prefs.account.changePassword.randomGen.generated')"
                :disabled="true"
                :min-height="30"
              />
            </div>
            <!-- // TODO: RC Q mx-5 didn't seem to work? https://getbootstrap.com/docs/4.0/utilities/spacing/ -->
            <div class="prompt-password__randomGen__refresh ml-5 mr-5">
              <button type="button" class="btn btn-sm bg-default" @click="generatePassword()">
                <i class="icon icon-2x icon-refresh" />
              </button>
            </div>
            <div class="prompt-password__randomGen__copy">
              <copy-to-clipboard :text="form.genP" :show-label="true"></copy-to-clipboard>
            </div>
          </div>
        </form>
        <div v-if="errorMessages && errorMessages.length" class="text-error">
          <!-- TODO: RC Q previously used this, is template a no op element? -->
          <!-- <template v-if="!!errorMessage">
            {{ errorMessage }}
          </template> -->
          <Banner v-for="(err, i) in errorMessages" :key="i" color="error" :label="err" />
        </div>
      </div>
      <template #actions>
        <button class="btn role-secondary" @click="show(false)">
          {{ t("prefs.account.changePassword.cancel") }}
        </button>
        <AsyncButton mode="apply" class="btn bg-error ml-10" :disabled="!canSubmit" @click="submit" />
      </template>
    </Card>
  </modal>
</template>

<style lang="scss">
// TODO: RC Q Should all margin/padding be done via bootstrap spacing? (https://getbootstrap.com/docs/4.0/utilities/spacing/ mt-10, pl-20, etc)
    .change-password-modal {
      // TODO: RC Q these selectors don't work when scoped, standard practise/acceptable?

      .v--modal {
        display: flex;

        .card-wrap {
          display: flex;
          flex-direction: column;

          .card-body {
            flex: 1;
            justify-content: start;
          }

          .card-actions {
            display: flex;
            justify-content: flex-end;
            width: 100%;
          }
        }
      }

      // .v--modal {
        // background-color: var(--nav-bg);
        // border-radius: var(--border-radius);
        // max-height: 100vh;
      // }
    }

    // TODO: RC Q Styles here are BEM'd, is that ok moving forward (particularly in no-scoped world?)
    .prompt-password {
      flex: 1;
      display: flex;

      &__generated {
        display: flex;

        .btn {
          flex: 1;
        }
      }

      &__randomGen {
        display: flex;
        align-items: center;

        &__label {
          flex: 1;
        }

        &__refresh {
          flex: 0;
        }

        &__copy {
          flex: 0;
          .btn {
            width: 160px;
          }
        }
      }

      .text-error {
        min-height: 38px;
      }

    }

</style>
