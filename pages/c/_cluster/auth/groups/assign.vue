<script>
import FooterComponent from '@/components/form/Footer';
import SelectPrincipal from '@/components/auth/SelectPrincipal.vue';

export default {
  components: {
    SelectPrincipal,
    FooterComponent
  },
  data() {
    return {
      errors:     [],
      footerMode: 'edit'
    };
  },
  methods: {
    addPrincipal(id) {
      console.log('addPrincipal', id);

      return true;
    },
    cancel() {
      this.$router.push({ name: 'c-cluster-auth-groups' });
    },
    save(buttonDone) {
      console.log('submit');
      this.errors = [];
      buttonDone(true);
    }
  }
};

</script>

<template>
  <div>
    <header>
      <div class="title">
        <h1 class="m-0">
          {{ t("authGroups.assign.title") }}
        </h1>
      </div>
    </header>

    <form>
      <SelectPrincipal :mode="'true'" :retain-selection="true" @add="addPrincipal" />
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
