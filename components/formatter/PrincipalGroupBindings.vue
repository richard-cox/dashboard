<script>
import { NORMAN, RBAC } from '@/config/types';

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
      const globalRoleBindings = this.$store.getters['management/all'](RBAC.GLOBAL_ROLE_BINDING);

      return globalRoleBindings
        // Bindings for this group
        .filter(globalRoleBinding => globalRoleBinding.groupPrincipalName === principal.id)
        // Display name of role associated with binding
        .map((binding) => {
          const role = this.$store.getters['management/byId'](RBAC.GLOBAL_ROLE, binding.globalRoleName);

          return role ? role.displayName : 'Unknown role';
        })
        .sort((a, b) => a.localeCompare(b));
    }
  }
};
</script>

<template>
  <div>
    <!-- TODO: RC link to details page for role. see model details link <entity>.detailLocation -->
    {{ bindings.join(', ') }}
  </div>
</template>
