
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
  fetch() {
    richard.log('FETCH');
    // this.allRoles = await this.$store.dispatch('management/findAll', { type: RBAC.GLOBAL_ROLE });

    try {
      this.show = false;
      this.allValues = { [this.timestamp]: { admin: true } };

      this.show = true;
    } catch (e) {
      console.error('""""', e);
    }
  },
  data() {
    return {
      allValues:   {},
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
  created() {
    richard.log('CREATED');
    this.$fetch();
  },
  methods: {
    getUnique(...ids) {
      const unqiue = `${ this.timestamp }-${ this.principalId }-${ ids.join('-') }`;

      richard.log(unqiue);

      return unqiue;
    },
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending && !show && !principalId" />
  <div v-else>
    <!-- <form> -->
    <Checkbox :key="getUnique('global', 'admin', 'checkbox')" v-model="allValues[timestamp].admin" :label="'asdsad'" :mode="mode" /> (DEBUG: {{ allValues[timestamp].admin }})
    {{ getUnique('global', 'admin', 'checkbox') }}
    <!-- </form> -->
  </div>
</template>
