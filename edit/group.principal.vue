<script>
import createEditView from '@/mixins/create-edit-view';
import GlobalRoleBindings from '@/components/GlobalRoleBindings.vue';
import CruResource from '@/components/CruResource';

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
    save() {
      console.log('SSSAVVVEEE');
    }
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
      @finish="save"
    >
      <GlobalRoleBindings :principal-id="value.id" :mode="mode" @changed="rolesChanged" />
    </CruResource>
  </div>
</template>

<style lang="scss" scoped>
</style>
