<script lang="ts">
import Vue from 'vue';
import { mapGetters } from 'vuex';
import ResourceTable from '@shell/components/ResourceTable';
import { SECRET } from '@shell/config/types';
import { NAME as NAME_COL, NAMESPACE as NAMESPACE_COL, AGE, STATE } from '@shell/config/table-headers';
import { TYPES } from '@shell/models/secret';
import { Banner } from '@components/Banner';
import { stateDisplay, STATES_ENUM, colorForState, stateDisplay } from '@shell/plugins/dashboard-store/resource-class';
import { BadgeState } from '@components/BadgeState';

interface Data {
}

export default Vue.extend({
  components: {
    ResourceTable, Banner, BadgeState
  },

  data(): Data {
    // TODO: RC default sort
    // TODO: RC state for expiring certs?
    return {
      schema:  this.$store.getters['cluster/schemaFor'](SECRET),
      headers: [
        {
          ...STATE,
          formatter: null,
          name:      'certState',
          sort:      ['certState', 'nameSort'],
          value:     'certState',
        },
        NAME_COL,
        NAMESPACE_COL,
        {
          name:     'cn',
          labelKey: 'secret.certificate.cn',
          getValue: (row) => {
            return row.cn + (row.unrepeatedSans.length ? this.t('secret.certificate.plusMore', { n: row.unrepeatedSans.length }) : ''); // TODO: RC
          },
          sort:   ['cn'],
          search: ['cn'],
        }, {
          name:      'cert-expires',
          labelKey:  'secret.certificate.expires',
          value:     'certInfo.notAfter',
          formatter: 'Date',
          sort:      ['certInfo.notAfter'],
          search:    ['certInfo.notAfter'],
        }, {
          name:      'cert-expires2',
          labelKey:  'secret.certificate.expires',
          value:     'timeTilExpirationEpoch',
          formatter: 'LiveDate',
          sort:      ['timeTilExpiration'],
          search:    ['timeTilExpiration'],
        },
        AGE
      ],
      certs:          [],
      intervalHandle: null
    };
  },

  async fetch() {
    this.certs = await this.fetchCerts();
  },

  computed: {
    ...mapGetters(['currentCluster']),

    expiredData() {
      const res = this.certs.reduce((res, cert) => {
        switch (cert.certState) {
        case STATES_ENUM.EXPIRING:
          res.expiring.push(`${ cert.namespace }/${ cert.name }`);
          break;
        case STATES_ENUM.EXPIRED:
          res.expiring.push(`${ cert.namespace }/${ cert.name }`);
          break;
        }

        return res;
      }, {
        expiring: [],
        expired:  []
      });

      return {
        expiring: res.expiring.length ? `The following certificates will expire in 8 days:\n${ res.expiring.join(',') }` : '',
        expired:  res.expired.length ? `The following certificates have expired:\n${ res.expiring.join(',') }` : '',
      };
    }
  },

  methods: {
    async fetchCerts() {
      // const url = `/k8s/clusters/${ this.currentCluster.id }/v1/secrets?filter=metadata.fields.1=kubernetes.io/tls`;
      const response = await this.$store.dispatch('cluster/findAll', {
        type: SECRET,
        opt:  {
          watch:  false,
          filter: { filter: `metadata.fields.1=${ TYPES.TLS }` }
        }
      });

      return response;
    },
  }
});
</script>

<template>
  <div>
    <Banner
      v-if="expiredData.expiring"
      color="warning"
      :label="expiredData.expiring"
    />
    <Banner
      v-if="expiredData.expired"
      color="error"
      :label="expiredData.expired"
    />
    <ResourceTable
      :loading="$fetchState.pending"
      :schema="schema"
      :headers="headers"
      :rows="certs"
    >
      <template #col:certState="{row}">
        <td>
          <BadgeState
            :color="row.certStateBackground"
            :label="row.certStateDisplay"
          />
        </td>
      </template>
    </ResourceTable>
  </div>
</template>

<style lang='scss' scoped>

</style>
