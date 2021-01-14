
<script>
import { mapGetters } from 'vuex';
import { RBAC } from '@/config/types';
import Checkbox from '@/components/form/Checkbox';
import { _VIEW } from '@/config/query-params';
import Loading from '@/components/Loading';
import richard from '@/utils/richards';

export default {
  components: {
    Checkbox,
    Loading
  },
  props:      {
    mode: {
      type:    String,
      default: _VIEW,
    },
    principalId: {
      type:     String,
      default: ''
    },
  },
  async fetch() {
    this.allRoles = await this.$store.dispatch('management/findAll', { type: RBAC.GLOBAL_ROLE });

    // Cover first load case, this is probably edit
    await this.updateRoles();
  },
  data() {
    return {
      globalPermissions: [
        'admin',
        'restricted-admin',
        'user',
        'user-base',
      ],
      sortedRoles: {},
      allRoles:    []
    };
  },
  computed: { ...mapGetters({ t: 'i18n/t' }) },
  watch:    {
    async principalId(principalId, oldPrincipalId) {
      if (principalId === oldPrincipalId) {
        return;
      }
      await this.updateRoles();
    }
  },
  methods: {
    getRoleType(role) {
      // See
      // - lib/global-admin/addon/security/accounts/new-group
      // - lib/global-admin/addon/components/cru-group-account
      // - lib/global-admin/addon/components/form-global-roles/component.js
      // TODO: RC CHECK EMBER Q how to defined three types of roles... builtin...  ... global ("authz.management.cattle.io/bootstrapping": "default-globalrole",)
      if (this.globalPermissions.find(p => p === role.id)) {
        return 'global';
      } else if (role.builtin) {
        return 'builtin';
      } else if (!role.isHidden) {
        // TODO: RC test isHidden
        return 'custom';
      }
    },
    async updateRoles() {
      if (!this.principalId) {
        return;
      }

      if (!this.sortedRoles[this.principalId]) {
        this.sortedRoles[this.principalId] = {
          global:  {},
          builtin: {},
          custom:  {}
        };
      }

      this.allRoles.forEach((role) => {
        const type = this.getRoleType(role);

        if (type) {
          this.sortedRoles[this.principalId][type][role.id] = {
            label:       this.t(`rbac.globalRoles.${ role.id }.label`) || role.displayName,
            description: this.t(`rbac.globalRoles.${ role.id }.description`) || role.description || 'No description provided',
            checked:     false,
            id:          role.id,
            role,
          };
        }
      });

      const globalRoleBindings = await this.$store.dispatch('management/findAll', { type: RBAC.GLOBAL_ROLE_BINDING });

      const boundRoles = globalRoleBindings.filter(globalRoleBinding => globalRoleBinding.groupPrincipalName === this.principalId);

      Object.entries(this.sortedRoles[this.principalId]).forEach(([type, types]) => {
        Object.entries(types).forEach(([roleId, mappedRole]) => {
          this.sortedRoles[this.principalId][type][roleId].checked = !!boundRoles.find(boundRole => boundRole.globalRoleName === roleId);
        });
      });
    },
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <div v-for="(sortedRole, type) in sortedRoles[principalId]" :key="type">
      <h2>{{ t("rbac.globalRoles.types." + type) }}</h2>
      <div v-for="(role, i) in sortedRole" :key="type + i">
        <Checkbox v-model="role.checked" :label="role.label" :mode="mode" /> (DEBUG: {{ role.checked }})
      </div>
    </div>
  </div>
</template>
