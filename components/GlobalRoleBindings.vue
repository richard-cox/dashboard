
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
    Loading,
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
    if (!this.principalId) {
      return;
    }

    try {
      this.allRoles = await this.$store.dispatch('management/findAll', { type: RBAC.GLOBAL_ROLE });

      this.selectedRoles = [] ;

      // if (!this.sortedRoles) {
      //   this.sortedRoles = {};
      // }
      // if (!this.sortedRoles[this.timestamp]) {
      //   this.sortedRoles[this.timestamp] = {};
      // }

      if (!this.sortedRoles) {
        this.sortedRoles = {
          global:  {},
          builtin: {},
          custom:  {}
        };
      }

      this.allRoles.forEach((role) => {
        const type = this.getRoleType(role);

        if (type) {
          this.sortedRoles[type][role.id] = {
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

      Object.entries(this.sortedRoles).forEach(([type, types]) => {
        Object.entries(types).forEach(([roleId, mappedRole]) => {
          // this.sortedRoles[type][roleId].checked = !!boundRoles.find(boundRole => boundRole.globalRoleName === roleId);
          // this.selectedRoles[roleId] = !!boundRoles.find(boundRole => boundRole.globalRoleName === roleId);
          if (!!boundRoles.find(boundRole => boundRole.globalRoleName === roleId)) {
            this.selectedRoles.push(roleId);
          }
        });
      });
    } catch (e) {
      console.error('""""', e); // TODO: RC
    }
  },
  data() {
    return {
      globalPermissions: [
        'admin',
        'restricted-admin',
        'user',
        'user-base',
      ],
      sortedRoles:   null,
      selectedRoles:   null,
      timestamp:     ''// new Date().getTime(),
    };
  },
  computed: { ...mapGetters({ t: 'i18n/t' }) },
  watch:    {
    async principalId(principalId, oldPrincipalId) {
      if (principalId === oldPrincipalId) {
        return;
      }
      await this.$fetch();
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
    getUnique(...ids) {
      return `${ this.timestamp }-${ this.principalId }-${ ids.join('-') }`;
    },
    inputChanged(a) {
      richard.log('', a);
    }
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />

  <div v-else>
    <form v-if="selectedRoles">
      {{ selectedRoles }}
      <div v-for="(sortedRole, type) in sortedRoles" :key="getUnique(type)">
        <h2>{{ t("rbac.globalRoles.types." + type) }}</h2>
        <div v-for="(role, roleId) in sortedRoles[type]" :key="getUnique(type, roleId)">
          <!-- :id="getUnique(type, roleId, principalId, 'checkbox')" -->
          <Checkbox
            :key="getUnique(type, roleId, 'checkbox')"
            v-model="selectedRoles"
            :value-when-true="roleId"
            :label="role.label"
            :mode="mode"
          />
          {{ role.description }}
        </div>
      </div>
    </form>
  </div>
</template>
