
<script>
import { mapGetters } from 'vuex';
import { RBAC } from '@/config/types';
import Checkbox from '@/components/form/Checkbox';
import { _VIEW } from '@/config/query-params';
import Loading from '@/components/Loading';
import richard from '@/utils/richards';
import Type from '@/components/nav/Type.vue';

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
    richard.log('FETCH');

    if (!this.principalId) {
      return;
    }

    try {
      this.allRoles = await this.$store.dispatch('management/findAll', { type: RBAC.GLOBAL_ROLE });

      this.show = false;
      // this.allValues = { [this.timestamp]: { admin: true } };
      this.allValues = { [this.timestamp]: { [this.principalId]: [] } };

      if (!this.sortedRoles) {
        this.sortedRoles = {};
      }
      if (!this.sortedRoles[this.timestamp]) {
        this.sortedRoles[this.timestamp] = {};
      }

      if (!this.sortedRoles[this.timestamp][this.principalId]) {
        this.sortedRoles[this.timestamp][this.principalId] = {
          global:  {},
          builtin: {},
          custom:  {}
        };
      }

      this.allRoles.forEach((role) => {
        // if (role.id !== 'admin' && role.id !== 'user') {
        //   return;
        // }
        const type = this.getRoleType(role);

        if (type) {
          this.sortedRoles[this.timestamp][this.principalId][type][role.id] = {
            label:       this.t(`rbac.globalRoles.${ role.id }.label`) || role.displayName,
            description: this.t(`rbac.globalRoles.${ role.id }.description`) || role.description || 'No description provided',
            checked:     false,
            id:          role.id,
            role,
          };
          // this.allValues[this.timestamp][role.id] = [];
          // this.allValues[this.timestamp][role.id] = false;
        }
      });

      const globalRoleBindings = await this.$store.dispatch('management/findAll', { type: RBAC.GLOBAL_ROLE_BINDING });

      const boundRoles = globalRoleBindings.filter(globalRoleBinding => globalRoleBinding.groupPrincipalName === this.principalId);

      Object.entries(this.sortedRoles[this.timestamp][this.principalId]).forEach(([type, types]) => {
        Object.entries(types).forEach(([roleId, mappedRole]) => {
          this.sortedRoles[this.timestamp][this.principalId][type][roleId].checked = !!boundRoles.find(boundRole => boundRole.globalRoleName === roleId);
          // this.allValues[this.timestamp][roleId] = !!boundRoles.find(boundRole => boundRole.globalRoleName === roleId);
          if (!!boundRoles.find(boundRole => boundRole.globalRoleName === roleId)) {
            this.allValues[this.timestamp][this.principalId].push(roleId);
          }
        });
      });

      this.show = true;
    } catch (e) {
      console.error('""""', e);
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
      sortedRoles: null,
      allValues:   null,
      show:        false,
      timestamp:   new Date().getTime(),
    };
  },
  computed: {},
  watch:    {
    async principalId(principalId, oldPrincipalId) {
      if (principalId === oldPrincipalId) {
        return;
      }
      await this.$fetch();
    }
  },
  // created() {
  //   richard.log('CREATED');
  //   this.$fetch();
  // },
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
    <form v-if="allValues">
      {{ allValues[timestamp][principalId] }}
      <div v-for="(sortedRole, type) in sortedRoles[timestamp][principalId]" :key="getUnique(type)">
        <h2>{{ t("rbac.globalRoles.types." + type) }}</h2>
        <div v-for="(role, roleId) in sortedRoles[timestamp][principalId][type]" :key="getUnique(type, roleId)">
          <!-- :id="getUnique(type, roleId, principalId, 'checkbox')" -->
          <Checkbox
            :key="getUnique(type, roleId, principalId, 'checkbox')"
            v-model="allValues[timestamp][principalId]"
            :value-when-true="roleId"
            :label="role.label"
            :mode="mode"
          />
        </div>
      </div>
    </form>
  </div>
</template>
