<script>
import { MANAGEMENT, NORMAN } from '@/config/types';

export default {
  props:      {
    value: {
      type:     String,
      default: ''
    },
  },
  computed: {

    bindings() {
      const principal = this.$store.getters['rancher/byId'](NORMAN.PRINCIPAL, this.value);
      const globalRoleBindings = this.$store.getters['management/all'](MANAGEMENT.GLOBAL_ROLE_BINDINGS);

      return globalRoleBindings
        // Bindings for this group
        .filter(globalRoleBinding => globalRoleBinding.groupPrincipalName === principal.id)
        // Display name of role associated with binding
        .map((binding) => {
          const role = this.$store.getters['management/byId'](MANAGEMENT.GLOBAL_ROLE, binding.globalRoleName);

          return role ? role.displayName : 'Unknown role';
        })
        .sort((a, b) => a.localeCompare(b));
    }
  }
};
</script>

<template>
  <div>
    <!-- TODO: RC These should be links each Role's Detail page, still currently WIP -->
    {{ bindings.join(', ') }}
  </div>
</template>
