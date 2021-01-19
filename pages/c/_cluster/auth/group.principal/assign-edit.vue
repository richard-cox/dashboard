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
    // this.principalId = this.$route.query.principal;
    // this.isEdit = !!this.principalId;
    this.mode = this.$route.query.mode;
    // this.isSelect = this.$route.query.select;

    this.spoofed = await this.$store.dispatch(`rancher/create`, { type: NORMAN.SPOOFED.GROUP_PRINCIPAL });
  },
  data() {
    return {
      errors:      [],
      // isView:      true,
      // isSelect:    true,
      principalId: null,
      spoofed:     null,
      mode:        _VIEW,
    };
  },
  // computed: {
  //   title() {
  //     const view = this.mode === _VIEW ? 'viewTitle' : this.isEdit ? 'editTitle' : 'assignTitle';

  //     return `authGroups.assignEdit.assignTitle`;
  //   },
  // },
  methods: {
    setPrincipal(id) {
      this.principalId = id;

      return true;
    },
    cancel() {
      this.spoofed.goToList();
    },
    async save(buttonDone) {
      this.errors = [];

      try {
        await this.$refs.grb.save();

        buttonDone(true);
        this.spoofed.goToList();
      } catch (err) {
        this.errors = exceptionToErrorsArray(err);
        buttonDone(false);
      }
    },
  }
};

</script>

<template>
  <Loading v-if="$fetchState.pending" />

  <div v-else>
    <div>
      <div class="masthead">
        <header>
          <div class="title">
            <h1 class="m-0">
              {{ t('authGroups.assignEdit.assignTitle') }}
            </h1>
          </div>
        </header>
      </div>

      <form>
        <!-- TODO: RC type in to get github user... shouldn't be allowed? should be but currently isn't in groups list? -->
        <!--  v-if="isSelect" -->
        <SelectPrincipal :mode="'true'" :retain-selection="true" class="mb-20" @add="setPrincipal" />
        <!-- <PrincipalComponent v-if="!isSelect && principalId" :key="principalId" :value="principalId" :use-muted="false" /> -->

        <GlobalRoleBindings ref="grb" :principal-id="principalId" :mode="mode" />

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
  .masthead {
    padding-bottom: 10px;
    border-bottom: 1px solid var(--border);
    margin-bottom: 10px;
  }
  HEADER {
    margin: 0;
  }
  .actions {
    display: flex;
    justify-content: flex-end;
    align-items:center;

    .btn {
      margin-left: 10px;
    }
  }
</style>
