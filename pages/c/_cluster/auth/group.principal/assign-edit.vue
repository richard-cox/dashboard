<script>
import FooterComponent from '@/components/form/Footer';
import Loading from '@/components/Loading';
import SelectPrincipal from '@/components/auth/SelectPrincipal.vue';
import PrincipalComponent from '@/components/auth/Principal.vue';
import GlobalRoleBindings from '@/components/GlobalRoleBindings.vue';
import { NORMAN } from '@/config/types';
import richard from '@/utils/richards';
import { _VIEW } from '@/config/query-params';

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
    this.mode = this.$route.query.mode; // TODO: RC edit vs view .. edit const
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

    };
  },
  computed: {
    title() {
      const view = this.mode === _VIEW ? 'viewTitle' : this.isEdit ? 'editTitle' : 'assignTitle';

      return `authGroups.assignEdit.${ view }`;
    }
  },
  methods: {
    addPrincipal(id) {
      this.principalId = id;

      return true;
    },
    cancel() {
      // TODO: RC
      // this.$route.name === c-cluster-auth-group.principal-assign-edit
      this.spoofed.goToList(); // TODO: Can't create spoofed
      // this.$router.push({ path: `/c/local/auth/group.principal` }); // Contains local
      // this.$router.push({ name: `c-cluster-auth-group.principal` });// Route with name 'c-cluster-auth-group.principal' does not exist
      // this.$router.push({ name: 'c-cluster-auth-groups' }); // from old virtual route.. can't assign route to spoofedType (schema added, not top level)
    },
    save(buttonDone) {
      this.errors = [];
      buttonDone(true);
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

        <GlobalRoleBindings :principal-id="principalId" :mode="mode" />

        <!-- TODO: RC is is view... not save button -->
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
