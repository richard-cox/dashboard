<script>
import FooterComponent from '@/components/form/Footer';
import Loading from '@/components/Loading';
import SelectPrincipal from '@/components/auth/SelectPrincipal.vue';
import PrincipalComponent from '@/components/auth/Principal.vue';
import GlobalRoleBindings from '@/components/GlobalRoleBindings.vue';
import { NORMAN } from '@/config/types';
import { _VIEW } from '@/config/query-params';
import { exceptionToErrorsArray } from '@/utils/error';

export default {
  components: {
    SelectPrincipal,
    FooterComponent,
    GlobalRoleBindings,
    Loading
  },
  fetch() {
    // this.mode = this.$route.query.mode;
  },
  data() {
    return {
      mode:        this.$route.query.mode,
      errors:      [],
      principalId: null,
      spoofed:     null,
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
    async cancel() {
      const spoofed = await this.$store.dispatch(`rancher/create`, { type: NORMAN.SPOOFED.GROUP_PRINCIPAL });

      spoofed.goToList();
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
        <SelectPrincipal :mode="'true'" :retain-selection="true" class="mb-20" @add="setPrincipal" />

        <GlobalRoleBindings ref="grb" :principal-id="principalId" :mode="mode" />

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
