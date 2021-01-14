
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
    const roles = await this.$store.dispatch('management/findAll', { type: RBAC.GLOBAL_ROLE });

    // console.log(roles);
    this.allRoles = { };
    roles.forEach((role) => {
      const mapped = {
        label:       this.t(`rbac.globalRoles.${ role.id }.label`) || role.displayName,
        description: this.t(`rbac.globalRoles.${ role.id }.description`) || role.description || 'No description provided',
        checked:     false,
        id:          role.id,
        role,
      };

      // this.allRoles[role.id] = false;

      // custom (annotation "field.cattle.io/creatorId")
      // See
      // - lib/global-admin/addon/security/accounts/new-group
      // - lib/global-admin/addon/components/cru-group-account
      // - lib/global-admin/addon/components/form-global-roles/component.js
      // TODO: RC CHECK EMBER Q how to defined three types of roles... builtin...  ... global ("authz.management.cattle.io/bootstrapping": "default-globalrole",)
      const type = this.getType(role);

      if (type) {
        // console.error(type, role.id);
        this.sortedRoles[type][role.id] = mapped;
      }
    });
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
      allRoles:    {},
      sortedRoles: {
        global:  {},
        builtin: {},
        custom:  {}
      },
      junk: false
    };
  },
  computed: {
    ...mapGetters({ t: 'i18n/t' }),
    // getMode() {
    //   return this.mode || _VIEW;
    // }
    hmmm() {
      return a => this.allRoles[a];
    }
  },
  watch:    {
    async principalId(principalId, oldPrincipalId) {
      if (principalId === oldPrincipalId) {
        return;
      }
      await this.updateRoles();
    }
  },
  methods: {
    getType(role) {
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

      const globalRoleBindings = await this.$store.dispatch('management/findAll', { type: RBAC.GLOBAL_ROLE_BINDING });

      const boundRoles = globalRoleBindings.filter(globalRoleBinding => globalRoleBinding.groupPrincipalName === this.principalId);

      richard.log(this.principalId, boundRoles);

      // Object.entries(this.allRoles).forEach(([key, val]) => {
      //   // this.$nextTick(() => {
      //   this.allRoles[key] = !!boundRoles.find(boundRole => boundRole.globalRoleName === key);
      //   // });
      // });
      // const allRoles = Object.values(this.sortedRoles);

      // richard.log('allRoles: ', allRoles);
      Object.entries(this.sortedRoles).forEach(([type, types]) => {
        Object.entries(types).forEach(([roleId, mappedRole]) => {
          this.sortedRoles[type][roleId].checked = !!boundRoles.find(boundRole => boundRole.globalRoleName === roleId);
        });
      });
    },
    toggleAll(type, roleId, a) {
      richard.log('', type);
      richard.log('', roleId);
      richard.log('', a);
      this.sortedRoles[type][roleId].checked = a;
      // this.allRoles[roleId] = a;
    }
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <div v-for="(sortedRole, type) in sortedRoles" :key="type">
      <h2>{{ t("rbac.globalRoles.types." + type) }}</h2>
      <div v-for="(role, i) in sortedRole" :key="type + i">
        <Checkbox v-model="role.checked" :label="role.label" :mode="mode" /> (DEBUG: {{ role.checked }})
      </div>
    </div>
  </div>
</template>
