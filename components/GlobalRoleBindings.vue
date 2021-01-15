
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
    try {
      this.allRoles = await this.$store.dispatch('management/findAll', { type: RBAC.GLOBAL_ROLE });

      if (!this.sortedRoles) {
        this.sortedRoles = {
          global:  {},
          builtin: {},
          custom:  {}
        };

        this.allRoles.forEach((role) => {
          const type = this.getRoleType(role);

          if (type) {
            this.sortedRoles[type][role.id] = {
              label:       this.t(`rbac.globalRoles.${ role.id }.label`) || role.displayName,
              description: this.t(`rbac.globalRoles.${ role.id }.description`) || role.description || 'No description provided',
              id:          role.id,
              role,
            };
          }
        });

        // TODO: RC This could be a lot of roles... when we really only want those for the current principal
        // Moving this out into the watch has issues....
        this.globalRoleBindings = await this.$store.dispatch('management/findAll', { type: RBAC.GLOBAL_ROLE_BINDING });

        this.update();
      }
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
      globalRoleBindings: null,
      sortedRoles:        null,
      selectedRoles:      [],
    };
  },
  computed: { ...mapGetters({ t: 'i18n/t' }) },
  watch:    {
    principalId(principalId, oldPrincipalId) {
      if (principalId === oldPrincipalId) {
        return;
      }
      this.update();
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
      return `${ this.principalId }-${ ids.join('-') }`;
    },
    update() {
      if (!this.principalId) {
        return;
      }

      this.selectedRoles = [] ;

      const boundRoles = this.globalRoleBindings.filter(globalRoleBinding => globalRoleBinding.groupPrincipalName === this.principalId);

      Object.entries(this.sortedRoles).forEach(([type, types]) => {
        Object.entries(types).forEach(([roleId, mappedRole]) => {
          if (!!boundRoles.find(boundRole => boundRole.globalRoleName === roleId)) {
            this.selectedRoles.push(roleId);
          }
        });
      });
    }
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />

  <div v-else>
    <form v-if="selectedRoles">
      <br>{{ selectedRoles }}<br><br>
      <div v-for="(sortedRole, type) in sortedRoles" :key="getUnique(type)" class="role-group mb-10">
        <h2>{{ t("rbac.globalRoles.types." + type) }}</h2>
        <div class="checkbox-section" :class="'checkbox-section--' + type">
          <div v-for="(role, roleId) in sortedRoles[type]" :key="getUnique(type, roleId)" class="checkbox mb-10 mr-10">
            <Checkbox
              :key="getUnique(type, roleId, 'checkbox')"
              v-model="selectedRoles"
              :value-when-true="roleId"
              :label="role.label"
              :mode="mode"
            />
            <div class="description">
              {{ role.description }}
            </div>
          </div>
        </div>
      </div>
    </form>
  </div>
</template>

<style lang='scss' scoped>
  .role-group {
    .checkbox-section {
      display: grid;

      grid-template-columns: repeat(3, 1fr);

      &--global {
        grid-template-columns: 100%;
      }

      .checkbox {
        display: flex;
        flex-direction: column;

        .description {
          font-size: 11px; // TODO: RC
          margin-top: 5px;
        }
      }
    }
  }
</style>
