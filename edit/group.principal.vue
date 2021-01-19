<script>
import createEditView from '@/mixins/create-edit-view';
import GlobalRoleBindings from '@/components/GlobalRoleBindings.vue';
import CruResource from '@/components/CruResource';
import { exceptionToErrorsArray } from '@/utils/error';

export default {
  components: {
    GlobalRoleBindings,
    CruResource
  },
  mixins: [createEditView],
  data() {
    return { errors: [] };
  },
  methods:  {
    async save(buttonDone) {
      this.errors = [];

      try {
        await this.$refs.grb.save();

        buttonDone(true);
        // TODO: RC Should this go back to list view on save??
      } catch (err) {
        this.errors = exceptionToErrorsArray(err);
        buttonDone(false);
      }
    },
  }
};
</script>

<template>
  <div>
    <!-- -->
    <!-- :validation-passed="true" TODO: RC -->
    <CruResource
      :done-route="doneRoute"
      :mode="mode"
      :resource="value"
      :validation-passed="true"
      :errors="errors"
      :can-yaml="false"
      @finish="save"
    >
      <GlobalRoleBindings ref="grb" :principal-id="value.id" :mode="mode" />
    </CruResource>
  </div>
</template>

<style lang="scss" scoped>
</style>
