
<script>
import { mapGetters } from 'vuex';
import { RBAC } from '@/config/types';
import Checkbox from '@/components/form/Checkbox';
import { _VIEW } from '@/config/query-params';
import Loading from '@/components/Loading';
import richard from '@/utils/richards';

// TODO: RC Case when there's no auth providers / groups
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
              label:       this.t(`rbac.globalRoles.role.${ role.id }.label`) || role.displayName,
              description: this.t(`rbac.globalRoles.role.${ role.id }.detail`) || role.description || this.t(`rbac.globalRoles.unknownRole.detail`),
              id:          role.id,
              role,
            };
          }
        });

        // TODO: RC Q This could be a lot of roles... when we really only want those for the current principal
        // Moving this out into the watch has issues....
        this.globalRoleBindings = await this.$store.dispatch('management/findAll', { type: RBAC.GLOBAL_ROLE_BINDING });

        this.update();
      }
    } catch (e) {
      console.error('""""', e); // TODO: RC ! Is there a generic pattern for this?
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
      user:               null, // This will be populated when user view is done
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
    // TODO: RC validate - confirmUserCanLogIn - lib/global-admin/addon/components/form-global-roles/component.js
    getRoleType(role) {
      if (this.globalPermissions.find(p => p === role.id)) {
        return 'global';
      } else if (role.hidden) {
        return null;
      } else if (role.builtin) {
        return 'builtin';
      } else {
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
        <template v-if="Object.keys(sortedRole).length">
          <h2>{{ t(`rbac.globalRoles.types.${type}.label`) }}</h2>
          <div class="type-description mb-10">
            {{ t(`rbac.globalRoles.types.${type}.detail`, { type: 'Application', isUser: !!user }) }}
          </div>
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
        </template>
      </div>
    </form>
  </div>
</template>

<style lang='scss' scoped>
  $detailSize: 11px;// TODO: RC
  .role-group {
    .type-description {
      font-size: $detailSize;
    }
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
          font-size: $detailSize;
          margin-top: 5px;
        }
      }
    }
  }
</style>
