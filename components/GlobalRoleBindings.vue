
<script>
import { mapGetters } from 'vuex';
import { RBAC } from '@/config/types';
import Checkbox from '@/components/form/Checkbox';

export default {
  components: { Checkbox },
  props:      {
    isView: {
      type:    Boolean,
      default: false,
    },
    principalId: {
      type:     String,
      default: ''
    },
  },
  async fetch() {
    const roles = await this.$store.dispatch('management/findAll', { type: RBAC.GLOBAL_ROLE });

    // console.log(roles);
    this.allRoles = {
      global:  {},
      builtin: {},
      custom:  {}
    };
    roles.forEach((role) => {
      const mapped = {
        label:       this.t(`rbac.globalRoles.${ role.id }.label`) || role.displayName,
        description: this.t(`rbac.globalRoles.${ role.id }.description`) || role.description || 'No description provided',
        // checked:     false,
        id:          role.id
      };

      this.allRoles[role.id] = mapped;

      // custom (annotation "field.cattle.io/creatorId")
      // See
      // - lib/global-admin/addon/security/accounts/new-group
      // - lib/global-admin/addon/components/cru-group-account
      // - lib/global-admin/addon/components/form-global-roles/component.js
      // TODO: RC CHECK EMBER Q how to defined three types of roles... builtin...  ... global ("authz.management.cattle.io/bootstrapping": "default-globalrole",)
      if (this.globalPermissions.find(p => p === role.id)) {
        this.sortedRoles.global.push(mapped);
      } else if (role.builtin) {
        this.sortedRoles.builtin.push(mapped);
      } else if (!role.isHidden) {
        // TODO: RC test isHidden
        this.sortedRoles.custom.push(mapped);
      }
    });
  },
  data() {
    return {
      globalPermissions: [
        'admin',
        'restricted-admin',
        'user',
        'user-base',
      ],
      allRoles:    {},
      sortedRoles: {
        global:  [],
        builtin: [],
        custom:  []
      },
    };
  },
  computed: { ...mapGetters({ t: 'i18n/t' }) },
  watch:    {
    async principalId(principalId, oldPrincipalId) {
      if (!principalId || principalId === oldPrincipalId) {
        return;
      }

      const globalRoleBindings = await this.$store.dispatch('management/findAll', { type: RBAC.GLOBAL_ROLE_BINDING });

      const boundRoles = globalRoleBindings.filter(globalRoleBinding => globalRoleBinding.groupPrincipalName === this.principalId);

      console.log(principalId, boundRoles);

      Object.entries(this.allRoles).forEach(([key, val]) => {
        this.$nextTick(() => {
          this.allRoles[key].checked = !!boundRoles.find(boundRole => boundRole.globalRoleName === key);
        });
      });

      console.log(this.allRoles);
    }
  }
};
</script>

<template>
  <div>
    <!-- hello world {{ principalId }}<br> -->
    <!-- <h2>Global Permissions</h2> -->
    <div v-for="(sortedRole, type) in sortedRoles" :key="type">
      <h2>{{ t("rbac.globalRoles.types." + type) }}</h2>
      <div v-for="(role, i) in sortedRole" :key="type + i">
        <Checkbox v-model="allRoles[role.id].checked" :disabled="isView" :label="role.label" />
        <!-- {{ role.description }}<br>
        ¬¬{{ role.id }}¬¬
        ¬¬{{ !!allRoles[role.id] }}¬¬
        ¬¬{{ allRoles[role.id].checked }}¬¬ -->
      </div>
    </div>

    <!-- <div v-for="(role, i) in sortedRoles.global" :key="'global-' + i">
      <template v-if="isView">{{ role.label }} - {{ role.description }} - {{ role.checked }}</template> -->
    <!-- @input="update"
      <Checkbox v-model="allRoles[role.id].checked" :disabled="isView" :label="role.label" />
      {{ role.description }}
    </div>
    <h2>Custom</h2>
    <div v-for="(role, i) in sortedRoles.custom" :key="'custom-' + i">
      {{ role.label }} - {{ role.description }} - {{ role.checked }}
    </div>
    <h2>Built-in</h2>
    <div v-for="(role, i) in sortedRoles.builtin" :key="'builtin-' + i">
      {{ role.label }} - {{ role.description }} - {{ role.checked }}
    </div> -->
  </div>
</template>
