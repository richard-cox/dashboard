<script>
import FooterComponent from '@/components/form/Footer';
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
    GlobalRoleBindings
  },
  async fetch() {
    this.principalId = this.$route.query.principal;
    this.mode = this.$route.query.mode; // TODO: RC edit vs view .. edit const
    this.showSelect = this.$route.query.select;

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
      footerMode:  'edit',
      isView:      true,
      principalId: null,
      principal:   null,
      spoofed:     null,
      mode:        _VIEW,
      showSelect:  true,
    };
  },
  methods: {
    addPrincipal(id) {
      richard.log('addPrincipal', id);
      this.principalId = id;

      return true;
    },
    cancel() {
      richard.log('¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬' );
      // TODO: RC
      // this.$route.name === c-cluster-auth-group.principal-assign-edit
      this.spoofed.goToList(); // TODO: Can't create spoofed
      // this.$router.push({ path: `/c/local/auth/group.principal` }); // Contains local
      // this.$router.push({ name: `c-cluster-auth-group.principal` });// Route with name 'c-cluster-auth-group.principal' does not exist
      // this.$router.push({ name: 'c-cluster-auth-groups' }); // from old virtual route.. can't assign route to spoofedType (schema added, not top level)
    },
    save(buttonDone) {
      richard.log('submit');
      this.errors = [];
      buttonDone(true);
    }
  }
};

</script>

<template>
  <!-- // TODO: RC add loading -->
  <div>
    <header>
      <div class="title">
        <h1 class="m-0">
          <!-- TODO: RC assign / update -->
          {{ t("authGroups.assign.title") }}
        </h1>
      </div>
    </header>

    <form>
      <SelectPrincipal v-if="showSelect" :mode="'true'" :retain-selection="true" @add="addPrincipal" />
      <PrincipalComponent v-if="principalId" :key="principalId" :value="principalId" :use-muted="false" />

      <GlobalRoleBindings :principal-id="principalId" :mode="mode" />

      <!-- TODO: RC is is view... not save button -->
      <FooterComponent
        :mode="footerMode"
        :errors="errors"
        @save="save"
        @done="cancel"
      >
      </footercomponent>
    </form>
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
