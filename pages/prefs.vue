<script>
import day from 'dayjs';
import ButtonGroup from '@/components/ButtonGroup';
import Checkbox from '@/components/form/Checkbox';
import {
  mapPref, THEME, LANDING, KEYMAP, DEV, DATE_FORMAT, TIME_FORMAT, ROWS_PER_PAGE, HIDE_DESC
} from '@/store/prefs';
import LabeledSelect from '@/components/form/LabeledSelect';
import { addObject } from '@/utils/array';
import Card from '@/components/Card';
import AsyncButton from '@/components/AsyncButton';
import LabeledInput from '@/components/form/LabeledInput';
import { NORMAN } from '@/config/types';
import { CHARSET, randomStr } from '@/utils/string';
import CopyToClipboard from '@/components/CopyToClipboard.vue';

// TODO: RC Move password to it's own component
// TODO: RC only show feature when principle is local

export default {
  components: {
    ButtonGroup, LabeledSelect, Checkbox, Card, AsyncButton, LabeledInput, CopyToClipboard,
  },
  data(ctx) {
    return {
      password: {
        prevent:            false,
        error:              '',
        deleteKeys:         false,
        userPassword:       true,
        genPasswordOptions: [{
          labelKey: `prefs.account.changePassword.userPassword`,
          value:    true
        }, {
          labelKey: `prefs.account.changePassword.generatedPassword`,
          value:    false
        }],
        form: {
          currentP: null,
          newP:     null,
          genP:     randomStr(16, CHARSET.ALPHA_NUM),
          confirmP: null
        }
      }

    };
  },
  computed:   {
    theme:      mapPref(THEME),
    keymap:     mapPref(KEYMAP),
    dev:        mapPref(DEV),
    landing:    mapPref(LANDING),
    dateFormat: mapPref(DATE_FORMAT),
    timeFormat: mapPref(TIME_FORMAT),
    perPage:    mapPref(ROWS_PER_PAGE),
    hideDesc:   mapPref(HIDE_DESC),

    themeOptions() {
      return this.$store.getters['prefs/options'](THEME).map((value) => {
        return {
          labelKey: `prefs.theme.${ value }`,
          value
        };
      });
    },

    landingOptions() {
      return this.$store.getters['prefs/options'](LANDING).map((value) => {
        return {
          labelKey: `prefs.landing.${ value }`,
          value
        };
      });
    },

    keymapOptions() {
      return this.$store.getters['prefs/options'](KEYMAP).map((value) => {
        return {
          labelKey: `prefs.keymap.${ value }`,
          value
        };
      });
    },

    dateOptions() {
      const now = day();

      return this.$store.getters['prefs/options'](DATE_FORMAT).map((value) => {
        return {
          label: now.format(value),
          value
        };
      });
    },

    pm() {
      const now = day('1982-02-24 06:00:00 PM');

      return now.format(this.timeFormat.replace(/:ss/, ''));
    },

    am() {
      const now = day('1982-02-24 06:00:00 AM');

      return now.format(this.timeFormat.replace(/:ss/, ''));
    },

    timeOptions() {
      const now = day();

      return this.$store.getters['prefs/options'](TIME_FORMAT).map((value) => {
        return {
          label: now.format(value),
          value
        };
      });
    },

    perPageOptions() {
      const t = this.$store.getters['i18n/t'];

      return this.$store.getters['prefs/options'](ROWS_PER_PAGE).map(count => t('prefs.perPage.value', { count }));
    },

    hideDescriptions: {
      get() {
        return this.hideDesc.includes('ALL');
      },

      set(neu) {
        let val;

        if ( neu ) {
          val = this.hideDesc.slice();
          addObject(val, 'ALL');
        } else {
          // On unset, clear all remembered individual ones too
          val = [];
        }

        this.hideDesc = val;
      }
    },

    // provider: "local"
    // loginName: "admin"
    // name: undefined // Defined in /v3/users?me=true&limit=-1&sort=name
    // id: "local://user-28bkb"

    principal() {
      // TODO: RC missing `name`.. though in normal/v3 user
      // TODO: RC Q Where does this info originally come from, session? how does it get into the store?
      const a = this.$store.getters['rancher/byId'](NORMAN.PRINCIPAL, this.$store.getters['auth/principalId']) || {};

      // console.log(a);

      return a;
    },

    // TODO: RC contains correct name... but the id is different from principle's id
    // user() {
    // const user = await this.$store.dispatch('rancher/find', {
    //   type: NORMAN.USER,
    //   id:   this.principal, //"local://user-28bkb" --> "user-28bkb"
    //   opt:  { url: '/v3/users?me=true&limit=-1&sort=name' }
    // });
    // }

    passwordType: {
      get() {
        return this.password.userPassword;
      },

      set(isUserGenerated) {
        this.password.userPassword = isUserGenerated;
        // TODO: RC IMPROVE!!
        if (isUserGenerated) {
          this.validateNewPassword();
        } else {
          this.password.error = '';
        }
      }
    },

    passwordNew: {
      get() {
        return this.password.form.newP;
      },

      set(p) {
        this.password.form.newP = p;
        this.validateNewPassword();
      }
    },

    passwordConfirm: {
      get() {
        return this.password.form.confirmP;
      },

      set(p) {
        this.password.form.confirmP = p;
        this.validateNewPassword();
      }
    },

    errorText() { // TODO: RC remove?
      return this.password.rawError || this.$store.getters['i18n/t'](this.password.error);
    },

  },
  watch:   {},
  methods: {

    showChangePassword() {
      this.$modal.show('password-modal');
      this.password.userPassword = true;
      this.password.form = {
        ...this.password.form,
        currentP: null,
        newP:     null,
        confirmP: null
      };
    },
    validateNewPassword() {
      // TODO: RC improve!
      if (this.password.form.confirmP && this.password.form.newP !== this.password.form.confirmP) {
        this.password.error = 'prefs.account.changePassword.errors.missmatchedPassword';
      } else {
        this.password.error = '';
      }
    },
    async changePassword(buttonCb) {
      try {
        await this.$store.dispatch('rancher/request', {
          url:           '/v3/users?action=changepassword',
          method:        'post',
          headers:       { 'Content-Type': 'application/json' },
          data:          {
            // TODO: RC add keys option
            currentPassword: this.password.form.currentP,
            newPassword:     this.password.form.newP || this.password.form.genP // TODO: RC fix
          },
        });

        buttonCb(true);
        this.$modal.hide('password-modal');
      } catch (err) {
        console.log('ERROR: ', err.message);
        if (err.message) {
          // TODO: RC cannot convert the returned err codes to i18n id's
          // no current password: {"baseType":"error","code":"InvalidBodyContent","message":"must specify current password","status":422,"type":"error"}
          // invalid current password: {"baseType":"error","code":"InvalidBodyContent","message":"invalid current password","status":422,"type":"error"}
          this.password.error = true;
          // TODO: RC Q Setting this after a different error makes no change in ui
          this.password.rawError = err.message;
        } else {
          this.password.error = 'prefs.account.changePassword.errors.failedToChange';
        }

        buttonCb(false);
      }
    },
    generatePassword() {
      this.password.form.genP = randomStr(16, CHARSET.ALPHA_NUM);
    },
    // TODO: RC only show edit if local provider
  },
};
</script>

<template>
  <div class="prefs">
    <h1 v-t="'prefs.title'" />

    <!-- TODO: RC finish this  -->
    <h4 v-t="'prefs.account.label'" />
    <div>
      <!-- <ButtonGroup v-model="theme" :options="themeOptions" /> -->
    </div>
    <div class="mt-10">
      {{ principal }}
      {{ principal.loginName }}
      <t k="prefs.account.name" />
      <t k="prefs.account.username" />
    </div>
    <button
      type="button"
      class="btn role-secondary"
      @click="showChangePassword()"
    >
      {{ t("prefs.account.change") }}
    </button>
    <hr />
    <h4 v-t="'prefs.theme.label'" />
    <div>
      <ButtonGroup v-model="theme" :options="themeOptions" />
    </div>
    <div class="mt-10">
      <t k="prefs.theme.autoDetail" :pm="pm" :am="am" />
    </div>
    <hr />
    <h4 v-t="'prefs.landing.label'" />
    <ButtonGroup v-model="landing" :options="landingOptions" />
    <hr />
    <h4 v-t="'prefs.formatting'" />
    <div class="row">
      <div class="col span-4">
        <LabeledSelect
          v-model="dateFormat"
          :label="t('prefs.dateFormat.label')"
          :options="dateOptions"
        />
      </div>
      <div class="col span-4">
        <LabeledSelect
          v-model="timeFormat"
          :label="t('prefs.timeFormat.label')"
          :options="timeOptions"
        />
      </div>

      <div class="col span-4">
        <LabeledSelect
          v-model.number="perPage"
          :label="t('prefs.perPage.label')"
          :options="perPageOptions"
          placeholder="Select a row count"
        />
      </div>
    </div>
    <hr />
    <div class="row">
      <div class="col span-8">
        <h4 v-t="'prefs.keymap.label'" />
        <ButtonGroup v-model="keymap" :options="keymapOptions" />
      </div>
      <div class="col span-4">
        <h4 v-t="'prefs.advanced'" />
        <Checkbox v-model="dev" :label="t('prefs.dev.label')" />
        <Checkbox v-model="hideDescriptions" :label="t('prefs.hideDesc.label')" />
      </div>
    </div>

    <modal
      class="change-password-modal"
      name="password-modal"
      :width="500"
      :height="450"
    >
      <Card class="prompt-password" :show-highlight-border="false">
        <h4 slot="title" class="text-default-text">
          {{ t("prefs.account.changePassword.title") }}
        </h4>
        <div slot="body">
          <div class="col span-11 mb-10">
            <Checkbox v-model="password.deleteKeys" :label="t('prefs.account.changePassword.keys')" />
            <!-- TODO: RC disable global shortcuts whilst modal shows? -->
            <div>
              <LabeledInput
                key="current"
                v-model="password.form.currentP"
                :label="t('prefs.account.changePassword.currentPassword')"
                :mode="'edit'"
                :min-height="30"
                :required="true"
                type="password"
              />
              <ButtonGroup v-model="passwordType" :options="password.genPasswordOptions" class="generated" />

              <div v-if="passwordType" class="userGen">
                <LabeledInput
                  key="new"
                  v-model="passwordNew"
                  :label="t('prefs.account.changePassword.userGen.newPassword')"
                  :mode="'edit'"
                  :min-height="30"
                  :required="true"
                  type="password"
                />
                <LabeledInput
                  key="confirm"
                  v-model="passwordConfirm"
                  :label="t('prefs.account.changePassword.userGen.confirmPassword')"
                  :mode="'edit'"
                  :min-height="30"
                  :required="true"
                  type="password"
                />
              </div>
              <div v-else class="row randomGen">
                <LabeledInput
                  key="gen"
                  v-model="password.form.genP"
                  :label="t('prefs.account.changePassword.randomGen.generated')"
                  :disabled="true"
                  :min-height="30"
                />

                <button type="button" class="btn btn-sm bg-default gen" @click="generatePassword()">
                  <i class="icon icon-2x icon-refresh" />
                </button>
                <copy-to-clipboard :text="password.form.genP" :show-label="true"></copy-to-clipboard><br>
                <!-- TODO: RC Remove -->
                <!-- <copy-code>{{ password.form.genP }}</copy-code><br> -->
                <!-- <copy-to-clipboard-text :text="password.form.genP"></copy-to-clipboard-text><br> -->
                <!-- <button class="btn role-tertiary" @click="copyPassword()">
                  {{ t("prefs.account.changePassword.randomGen.copy") }}
                </button> -->
              </div>
            </div>
          </div>
          <div class="text-error mb-10">
            <template v-if="!!password.error">
              <!-- // TODO: RC this did not update after multuple async requests -->
              <!-- // TODO: RC moving this into computed... how do translations in code? -->
              <!-- {{ password.rawError || t(password.error) }} -->
              {{ errorText }}
            </template>
          </div>
        </div>
        <template #actions>
          <button class="btn role-secondary" @click="$modal.hide('password-modal')">
            {{ t("prefs.account.changePassword.cancel") }}
          </button>
          <AsyncButton mode="apply" class="btn bg-error ml-10" :disabled="password.prevent" @click="changePassword" />
        </template>
      </Card>
    </modal>
  </div>
</template>

<style lang="scss">
  .prefs {
    .row {
      .hr {
        margin: 20px 0;
      }
    }

    .change-password-modal {
      .v--modal {
        background-color: var(--nav-bg);
        border-radius: var(--border-radius);
        max-height: 100vh;
      }
    }

    .prompt-password {
      #confirm {
        width: 90%;
        margin-left: 3px;
      }

      .actions {
        text-align: right;
      }

      .card-actions {
        display: flex;
        justify-content: flex-end;
      }

      .text-error {
        min-height: 20px;
      }

      // TODO: RC Tidy
      .checkbox-container, .generated, .labeled-input, .randomGen {
        margin-top: 10px;
      }

      .randomGen {
        .labeled-input {
          margin-top: 0
        }

        .labeled-input, .gen {
           margin-right: 5px;
        }
      }

    }
  }

</style>
