<script>
import FooterComponent from '@/components/form/Footer';
import Loading from '@/components/Loading';
import SelectPrincipal from '@/components/auth/SelectPrincipal.vue';
import PrincipalComponent from '@/components/auth/Principal.vue';
import GlobalRoleBindings from '@/components/GlobalRoleBindings.vue';
import { NORMAN, RBAC } from '@/config/types';
import { _VIEW } from '@/config/query-params';
import { exceptionToErrorsArray } from '@/utils/error';

export default {
  components: {
    SelectPrincipal,
    PrincipalComponent,
    FooterComponent,
    GlobalRoleBindings,
    Loading
  },
  async fetch() {
    this.principalId = this.$route.query.principal;
    this.isEdit = !!this.principalId;
    this.mode = this.$route.query.mode;
    this.isSelect = this.$route.query.select;

    this.spoofed = await this.$store.dispatch(`rancher/create`, { type: NORMAN.SPOOFED.GROUP_PRINCIPAL });
    // this.principal = await this.$store.dispatch('rancher/find', {
    //   type: NORMAN.PRINCIPAL,
    //   id:   this.principalId,
    //   opt:  { url: `/v3/principals/${this.principalId}` }
    // });
  },
  data() {
    return {
      errors:      [],
      isView:      true,
      isSelect:    true,
      principalId: null,
      spoofed:     null,
      mode:        _VIEW,
      roleChanges: null,
    };
  },
  computed: {
    title() {
      const view = this.mode === _VIEW ? 'viewTitle' : this.isEdit ? 'editTitle' : 'assignTitle';

      return `authGroups.assignEdit.${ view }`;
    },
  },
  methods: {
    addPrincipal(id) {
      this.principalId = id;

      return true;
    },
    cancel() {
      this.spoofed.goToList();
    },
    async saveAddedRoles() {
      const newBindings = await Promise.all(this.roleChanges.addRoles.map(role => this.$store.dispatch(`management/create`, {
        type:               RBAC.GLOBAL_ROLE_BINDING,
        metadata:           { generateName: `ui-` }, // TODO: RC is this correct... can/should it be empty?
        globalRoleName:     role,
        groupPrincipalName: this.principalId,
      })));

      await Promise.all(newBindings.map(newBinding => newBinding.save()));
    },
    async saveRemovedRoles() {
      const existingBindings = await Promise.all(this.roleChanges.removeBindings.map(bindingId => this.$store.dispatch('management/find', {
        type: RBAC.GLOBAL_ROLE_BINDING,
        id:   bindingId
      })));

      await Promise.all(existingBindings.map(existingBinding => existingBinding.remove()));
    },
    async save(buttonDone) {
      this.errors = [];

      try {
        await this.saveAddedRoles();
        await this.saveRemovedRoles();

        buttonDone(true);
        this.spoofed.goToList();
      } catch (err) {
        this.errors = exceptionToErrorsArray(err);
        buttonDone(false);
      }
    },
    rolesChanged($event) {
      this.roleChanges = $event;
    }
  }
};

</script>

<template>
  <Loading v-if="$fetchState.pending" />

  <div v-else>
    <div>
      <header>
        <div class="title">
          <h1 class="m-0">
            {{ t(title) }}
          </h1>
        </div>
      </header>

      <form>
        <SelectPrincipal v-if="isSelect" :mode="'true'" :retain-selection="true" @add="addPrincipal" />
        <PrincipalComponent v-if="principalId" :key="principalId" :value="principalId" :use-muted="false" />

        <GlobalRoleBindings :principal-id="principalId" :mode="mode" @changed="rolesChanged" />

        <!-- // TODO: RC Q How to disable button if there's no change? -->
        <FooterComponent
          :mode="mode"
          :errors="errors"
          @save="save"
          @done="cancel"
        >
        </footercomponent>
      </form>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .actions {
    display: flex;
    justify-content: flex-end;
    align-items:center;

    .btn {
      margin-left: 10px;
    }
  }
</style>
