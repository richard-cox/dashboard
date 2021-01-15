
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
    richard.log('FETCH');
    this.allRoles = await this.$store.dispatch('management/findAll', { type: RBAC.GLOBAL_ROLE });

    try {
      this.show = false;

      richard.log('1""""""""""""""""""""""""""""""""""""""""""""""""""""', this.show);
      if (!this.principalId) {
        return;
      }

      if (!this.sortedRoles) {
        this.sortedRoles = {
          global:  {},
          builtin: {},
          custom:  {}
        };
      }

      richard.log('this.allRoles count: ', this.allRoles.length);
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
        });
      });
      this.sortedRoles.global.admin.checked = true;

      this.show = true;
      richard.log('', this);
      richard.log(this.sortedRoles.global.admin.checked, this.a);
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
      allRoles:    [],
      show:        false,
      timestamp:   new Date().getTime(),
      test:        false,
    };
  },
  computed: {
    ...mapGetters({ t: 'i18n/t' }),
    a() {
      return this.sortedRoles?.global?.admin?.checked;
    },
    sortedRoles2() {
      const vm = this;

      return (type, roleId) => vm.sortedRoles ? vm.sortedRoles[type] ? vm.sortedRoles[type][roleId] : null : null;
    }
  },
  watch:    {
    async principalId(principalId, oldPrincipalId) {
      if (principalId === oldPrincipalId) {
        return;
      }
      await this.$fetch();
    }
  },
  created() {
    richard.log('CREATED');
    this.$fetch();
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

    },
    getUnique(...ids) {
      const unqiue = `${ this.timestamp }-${ this.principalId }-${ ids.join('-') }`;

      richard.log(unqiue);

      return unqiue;
    },
    checked(val) {
      richard.log('Checked: ', val);
      this.sortedRoles.global.admin.checked = val;

      return true;
    }
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending && !show && !principalId" />
  <div v-else>
    <!-- v1 -->
    <!-- <div v-for="(sortedRole, type) in sortedRoles[principalId]" :key="getUnique(type)">
      <h2>{{ t("rbac.globalRoles.types." + type) }}</h2>
      <div v-for="(role, i) in sortedRole" :key="getUnique(type, i)">
        <Checkbox :key="getUnique(type, i, 'checkbox')" v-model="role.checked" :label="role.label" :mode="mode" /> (DEBUG: {{ role.checked }})
      </div>
    </div> -->
    <!-- v2 -->
    <!-- <div v-for="(sortedRole, type) in sortedRoles[principalId]" :key="getUnique(type)">
      <h2>{{ t("rbac.globalRoles.types." + type) }}</h2>
      <div v-for="(role, roleId) in sortedRoles[principalId][type]" :key="getUnique(type, roleId)">
        <Checkbox :key="getUnique(type, roleId, 'checkbox')" v-model="sortedRoles[principalId][type][roleId].checked" :label="role.label" :mode="mode" /> (DEBUG: {{ role.checked }})
      </div>
    </div> -->
    <!-- v3 -->
    <!-- <div>
      <h2>{{ t("rbac.globalRoles.types.global") }}</h2>
      <div v-for="(role, roleId) in sortedRoles[principalId].global" :key="getUnique('global', roleId)">
        <Checkbox :key="getUnique('global', roleId, 'checkbox')" v-model="sortedRoles[principalId].global[roleId].checked" :label="role.label" :mode="mode" /> (DEBUG: {{ role.checked }})
        {{ getUnique('global', roleId, 'checkbox') }}
      </div>
      <h2>{{ t("rbac.globalRoles.types.builtin") }}</h2>
      <div v-for="(role, roleId) in sortedRoles[principalId].builtin" :key="getUnique('builtin', roleId)">
        <Checkbox :key="getUnique('builtin', roleId, 'checkbox')" v-model="sortedRoles[principalId].builtin[roleId].checked" :label="role.label" :mode="mode" /> (DEBUG: {{ role.checked }})
      </div>
      <h2>{{ t("rbac.globalRoles.types.custom") }}</h2>
      <div v-for="(role, roleId) in sortedRoles[principalId].custom" :key="getUnique('custom', roleId)">
        <Checkbox :key="getUnique('custom', roleId, 'checkbox')" v-model="sortedRoles[principalId].custom[roleId].checked" :label="role.label" :mode="mode" /> (DEBUG: {{ role.checked }})
      </div>
    </div> -->
    <!-- v4 -->
    <!-- <Checkbox :key="getUnique('global', 'admin', 'checkbox')" v-model="sortedRoles[principalId].global.admin.checked" :label="'asdsad'" :mode="mode" /> (DEBUG: {{ sortedRoles[principalId].global.admin.checked }})
    {{ getUnique('global', 'admin', 'checkbox') }} -->
    <!-- v5 WORKS! -->
    <!-- <Checkbox :key="getUnique('global', 'admin', 'checkbox')" v-model="test" :label="'asdsad'" :mode="mode" /> (DEBUG: {{ sortedRoles[principalId].global.admin.checked }})
    {{ getUnique('global', 'admin', 'checkbox') }} -->
    <!-- v6 efails in spa -->
    <!-- <Checkbox :key="getUnique('global', 'admin', 'checkbox')" v-model="sortedRoles.global.admin.checked" :label="'asdsad'" :mode="mode" /> (DEBUG: {{ sortedRoles.global.admin.checked }})
    {{ getUnique('global', 'admin', 'checkbox') }} -->
    <!-- v7 fails in spa -->
    <!-- <Checkbox :key="getUnique('global', 'admin', 'checkbox')" :value="sortedRoles.global.admin.checked" :label="'asdsad'" :mode="mode" @input="checked" /> (DEBUG: {{ sortedRoles.global.admin.checked }})
    {{ getUnique('global', 'admin', 'checkbox') }} -->
    <!-- v8 FAILS with spa fresh load -->
    <!-- (DEBUG: {{ sortedRoles.global.admin.checked }}) -->
    <!-- v9 FAILS with spa fresh load -->
    <!-- (DEBUG: {{ a }}) -->
    <!-- v10 fails... fresh reload ok but not return... spa fails-->
    <!-- <Checkbox :key="getUnique('global', 'admin', 'checkbox')" v-model="sortedRoles2('global', 'admin').checked" :label="'asdsad'" :mode="mode" /> (DEBUG: {{ sortedRoles2('global', 'admin').checked }})
      {{ getUnique('global', 'admin', 'checkbox') }} -->
    <!--  v11 same as v11 -->
    <!-- <template v-if="sortedRoles2('global', 'admin')">
      <Checkbox :key="getUnique('global', 'admin', 'checkbox')" v-model="sortedRoles2('global', 'admin').checked" :label="'asdsad'" :mode="mode" /> (DEBUG: {{ sortedRoles2('global', 'admin').checked }})
      {{ getUnique('global', 'admin', 'checkbox') }}
    </template> -->
    <!--  v12  -->
    <template v-if="sortedRoles2('global', 'admin')">
      <Checkbox :key="getUnique('global', 'admin', 'checkbox')" v-model="sortedRoles2('global', 'admin').checked" :label="'asdsad'" :mode="mode" /> (DEBUG: {{ sortedRoles2('global', 'admin').checked }})
      {{ getUnique('global', 'admin', 'checkbox') }}
    </template>
  </div>
</template>
