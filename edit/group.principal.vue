<script>
import CreateEditView from '@/mixins/create-edit-view';
import GlobalRoleBindings from '@/components/GlobalRoleBindings.vue';
import CruResource from '@/components/CruResource';
import { exceptionToErrorsArray } from '@/utils/error';
import { NORMAN } from '@/config/types';

export default {
  components: {
    GlobalRoleBindings,
    CruResource
  },
  mixins: [CreateEditView],
  data() {
    return {
      errors: [],
      valid:  false,
    };
  },
  methods:  {
    async save(buttonDone) {
      this.errors = [];

      try {
        await this.$refs.grb.save();
        this.$router.replace({ name: this.doneRoute }); // There's no navigation without this prod
        buttonDone(true);
      } catch (err) {
        this.errors = exceptionToErrorsArray(err);
        buttonDone(false);
      }
    },
    changed(changes) {
      this.valid = !!changes.addRoles.length || !!changes.removeBindings.length;
    },
  }
};
</script>

<template>
  <div>
    <CruResource
      :done-route="doneRoute"
      :mode="mode"
      :resource="value"
      :validation-passed="valid"
      :errors="errors"
      :can-yaml="false"
      @finish="save"
    >
      <GlobalRoleBindings ref="grb" :principal-id="value.id" :mode="mode" @changed="changed" />
    </CruResource>
  </div>
</template>

<style lang="scss" scoped>
</style>
