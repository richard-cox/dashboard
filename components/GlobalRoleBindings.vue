
<script>
import { mapGetters } from 'vuex';
import { RBAC } from '@/config/types';

export default {
  components: {},
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

    this.allRoles = roles.reduce((res, role) => {
      const mapped = {
        label:       this.t(`rbac.globalRoles.${ role.id }.label`) || role.displayName,
        description: this.t(`rbac.globalRoles.${ role.id }.description`) || role.description || 'No description provided',
      };

      // TODO: RC Q how to defined three types of roles... builtin... custom (annotation "field.cattle.io/creatorId") ... global ("authz.management.cattle.io/bootstrapping": "default-globalrole",)
      if (this.globalPermissions.find(p => p === role.id)) {
        res.global.push(mapped);
      } else if (role.builtin) {
        res.builtin.push(mapped);
      } else {
        res.custom.push(mapped);
      }

      return res;
    }, {
      global:  [],
      builtin: [],
      custom:  []
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
      allRoles: {
        global:  [],
        builtin: [],
        custom:  []
      },
    };
  },
  computed: { ...mapGetters({ t: 'i18n/t' }) },
  watch:    {
    async principalId(principalId, oldPrincipalId) {
      console.log('principalId triggered: ', principalId);
      if (!principalId || principalId === oldPrincipalId) {
        return;
      }

      // TODO: RC Can this be filtered by only the principals we're interested in... as this could be huge?
      // aka all entries where groupPrincipalName is one in string[],
      const globalRoleBindings = await this.$store.dispatch('management/findAll', { type: RBAC.GLOBAL_ROLE_BINDING });

      const boundRoles = globalRoleBindings.find(globalRoleBinding => globalRoleBinding.groupPrincipalName === this.principalId);

      // this.principal = await this.$store.getters['rancher/byId'](NORMAN.PRINCIPAL, this.principalId)
    }
  }
};
</script>

<template>
  <div>
    <!-- hello world {{ principalId }}<br> -->
    <h2>Global Permissions</h2>
    <div v-for="(row, i) in allRoles.global" :key="'global-' + i">
      {{ row.label }} - {{ row.description }}
    </div>
    <h2>Custom</h2>
    <div v-for="(row, i) in allRoles.custom" :key="'custom-' + i">
      {{ row.label }} - {{ row.description }}
    </div>
    <h2>Built-in</h2>
    <div v-for="(row, i) in allRoles.builtin" :key="'builtin-' + i">
      {{ row.label }} - {{ row.description }}
    </div>
  </div>
</template>
