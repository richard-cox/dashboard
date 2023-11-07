<script lang="ts">
import Vue from 'vue';
import { mapGetters } from 'vuex';
import ResourceTable from '@shell/components/ResourceTable';
import { SECRET } from '@shell/config/types';
import { NAME as NAME_COL, NAMESPACE as NAMESPACE_COL, AGE, STATE } from '@shell/config/table-headers';
import Secret, { TYPES } from '@shell/models/secret';
import { Banner } from '@components/Banner';
import { STATES_ENUM, stateDisplay } from '@shell/plugins/dashboard-store/resource-class';
import { BadgeState } from '@components/BadgeState';

interface Data {
  schema: Object,
  headers: Object[],
  certs: Secret[],
  pagingParams: {
        pluralLabel: string,
        singularLabel: string
      }
}

export default Vue.extend<Data, any, any, any>({
  components: {
    ResourceTable, Banner, BadgeState
  },

  async fetch() {
    this.certs = await this.fetchCerts();
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
          getValue: (row: Secret) => {
            return row.cn + (row.unrepeatedSans.length ? this.t('secret.certificate.plusMore', { n: row.unrepeatedSans.length }) : ''); // TODO: RC
          },
          sort:   ['cn'],
          search: ['cn'],
        }, {
          name:        'cert-expires2',
          labelKey:    'secret.certificate.expiresDuration',
          value:       'timeTilExpirationEpoch',
          formatter:   'LiveDate',
          sort:        ['timeTilExpiration'],
          search:      ['timeTilExpiration'],
          defaultSort: true,
        }, {
          name:      'cert-expires',
          labelKey:  'secret.certificate.expiresOn',
          value:     'certInfo.notAfter',
          formatter: 'Date',
          sort:      ['certInfo.notAfter'],
          search:    ['certInfo.notAfter'],
        },
        AGE
      ],
      certs:        [],
      pagingParams: {
        pluralLabel:   this.t('secret.certificate.certificates'),
        singularLabel: this.t('secret.certificate.certificate')
      }
    };
  },

  computed: {
    ...mapGetters(['currentCluster']),

    expiredData() {
      let expiring = 0;
      let expired = 0;

      debugger;
      for (let i = 0; i < this.certs.length; i++) {
        const cert = this.certs[i];

        if (cert.certState === STATES_ENUM.EXPIRING) {
          expiring++;
        }
        if (cert.certState === STATES_ENUM.EXPIRED) {
          expired++;
        }
      }

      // TODO: RC has filter, state
      // TODO: RC singlular (1 certificates expiring...)

      return {
        expiring: expiring ? this.t('secret.certificate.warnings.expiring', { count: expiring }) : '',
        expired:  expired ? this.t('secret.certificate.warnings.expired', { count: expired }) : '',
      };
    }
  },

  methods: {
    async fetchCerts() {
      // TODO: RC what happens if go to secrets? what happens when return here?

      return await this.$store.dispatch('cluster/findAll', {
        type: SECRET,
        opt:  {
          watch:  false,
          // Note - urlOptions handles filter in a weird way
          filter: { 'metadata.fields.1': TYPES.TLS }
        }
      });
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
      :paging-label="'secret.certificate.paging'"
      :paging-params="pagingParams"
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
