<script>
import ResourceTable from '@shell/components/ResourceTable';
import { NODE } from '@shell/config/types';
import { allHash } from '@shell/utils/promise';
import ResourceFetch from '@shell/mixins/resource-fetch';
import Deployment from '~/shell/models/apps.deployment';

export default {
  name:       'ListService',
  components: { ResourceTable },
  mixins:     [ResourceFetch],
  props:      {
    resource: {
      type:     String,
      required: true,
    },

    schema: {
      type:     Object,
      required: true,
    },
  },

  // fetch nodes before loading this page, as they may be referenced in the Target table column
  async fetch() {
    const store = this.$store;
    const inStore = store.getters['currentStore']();
    let hasNodes = false;

    try {
      const schema = store.getters[`${ inStore }/schemaFor`](NODE);

      if (schema) {
        hasNodes = true;
      }
    } catch {}

    const hash = { rows: this.$fetchType(this.resource) };

    if (hasNodes) {
      hash.nodes = store.dispatch(`${ inStore }/findAll`, { type: NODE });
    }
    await allHash(hash);
    this.memDump();

    const json = this.createJson(10000);

    this.memDump(`JSON`);

    const classes = this.createClass(json);

    this.memDump(`CLASS (Additional)`);
  },

  data() {
    return {
      totalJSHeapSize: 0,
      usedJSHeapSize:  0,
    };
  },

  methods: {
    toHuman(bytes) {
      const mb = bytes / 1024 / 1024;

      return `${ mb.toFixed(2) }MB`;
    },
    memDump(label) {
      const { totalJSHeapSize, usedJSHeapSize } = window.performance.memory;
      const changetotalJSHeapSize = totalJSHeapSize - this.totalJSHeapSize;
      const changeusedJSHeapSize = usedJSHeapSize - this.usedJSHeapSize;

      if (label) {
        console.info(`------------ ${ label }-------------`);
        console.info('totalJSHeapSize', this.toHuman(changetotalJSHeapSize), `(${ this.toHuman(totalJSHeapSize) })`);
        console.info('usedJSHeapSize', this.toHuman(changeusedJSHeapSize), `(${ this.toHuman(usedJSHeapSize) })`);
      }

      this.totalJSHeapSize = totalJSHeapSize;
      this.usedJSHeapSize = usedJSHeapSize;
    },

    createJson(count) {
      const res = [];

      for (let i = 0; i < count; i++) {
        res.push({
          id:    `deployments-20/ns-filter-${ i }`,
          type:  'apps.deployment',
          links: {
            remove: 'https://rancher.richardcox.dev/k8s/clusters/c-m-9j55jsbh/v1/apps.deployments/deployments-20/ns-filter-1',
            self:   'https://rancher.richardcox.dev/k8s/clusters/c-m-9j55jsbh/v1/apps.deployments/deployments-20/ns-filter-1',
            update: 'https://rancher.richardcox.dev/k8s/clusters/c-m-9j55jsbh/v1/apps.deployments/deployments-20/ns-filter-1',
            view:   'https://rancher.richardcox.dev/k8s/clusters/c-m-9j55jsbh/apis/apps/v1/namespaces/deployments-20/deployments/ns-filter-1'
          },
          apiVersion: 'apps/v1',
          kind:       'Deployment',
          metadata:   {
            annotations: {
              'deployment.kubernetes.io/revision': '2',
              'objectset.rio.cattle.io/applied':   'H4sIAAAAAAAA/4RRvY7UMBB+lWjqZM/edbJLtqWkpjldMR5PiMF/imcR6OR3R0bihECCcvzp+/UrYPEf+ag+J1gBS6lPXzWM8MUnByu85xLy98hJYITIgg4FYX0FTCkLis+p9jPbz0xSWU6HzydCkcAnn598F8GL4UUzTsuyXSZzW7bJKnedzmTIbbdF25mgjRDQcvin3I51hxVmd54tGj0v5moUmlndtDPOOLVdr7zNRIoWbd910YSRYYVUp80H4WPq7fpjLUgdcW8V63RWnVILU09xcAmesMJ6GaFyYJJ8dCCi0P7hLS2W8odDayMIxxJQ+Cfht+XCf3i/3CknQZ/4qLA+9zNG7H/yDLavMMJEMALTngfhKvehBuYyaKWUug/8zcug7/Aygo/4qRd92EeSB/w9CbSX1lr7EQAA//+CFsLwDAIAAA',
              'objectset.rio.cattle.io/id':        'a34e61ea-66f3-486f-b0d7-2c4cdf861b5c'
            },
            creationTimestamp: '2022-11-02T14:24:14Z',
            fields:            [
              'ns-filter-1',
              '1/1',
              1,
              1,
              '45h',
              'ns-filter',
              'ubuntu',
              'app=ns-filter-1'
            ],
            generation:    11,
            labels:        { 'objectset.rio.cattle.io/hash': '5d25ba41564740a45081d4d4d0f77ef5cc0c61b9' },
            managedFields: [
              {
                apiVersion: 'apps/v1',
                fieldsType: 'FieldsV1',
                fieldsV1:   {
                  'f:metadata': {
                    'f:annotations': {
                      '.':                                 {},
                      'f:objectset.rio.cattle.io/applied': {},
                      'f:objectset.rio.cattle.io/id':      {}
                    },
                    'f:labels': {
                      '.':                              {},
                      'f:objectset.rio.cattle.io/hash': {}
                    }
                  },
                  'f:spec': {
                    'f:progressDeadlineSeconds': {},
                    'f:replicas':                {},
                    'f:revisionHistoryLimit':    {},
                    'f:selector':                {},
                    'f:strategy':                {
                      'f:rollingUpdate': {
                        '.':                {},
                        'f:maxSurge':       {},
                        'f:maxUnavailable': {}
                      },
                      'f:type': {}
                    },
                    'f:template': {
                      'f:metadata': {
                        'f:labels': {
                          '.':     {},
                          'f:app': {}
                        }
                      },
                      'f:spec': {
                        'f:affinity':   {},
                        'f:containers': {
                          'k:{"name":"ns-filter"}': {
                            '.':                          {},
                            'f:command':                  {},
                            'f:image':                    {},
                            'f:imagePullPolicy':          {},
                            'f:name':                     {},
                            'f:resources':                {},
                            'f:terminationMessagePath':   {},
                            'f:terminationMessagePolicy': {}
                          }
                        },
                        'f:dnsPolicy':                     {},
                        'f:restartPolicy':                 {},
                        'f:schedulerName':                 {},
                        'f:securityContext':               {},
                        'f:terminationGracePeriodSeconds': {}
                      }
                    }
                  }
                },
                manager:   'agent',
                operation: 'Update',
                time:      '2022-11-02T17:57:09Z'
              },
              {
                apiVersion: 'apps/v1',
                fieldsType: 'FieldsV1',
                fieldsV1:   {
                  'f:metadata': { 'f:annotations': { 'f:deployment.kubernetes.io/revision': {} } },
                  'f:status':   {
                    'f:availableReplicas': {},
                    'f:conditions':        {
                      '.':                          {},
                      'k:{"type":"Available"}': {
                        '.':                    {},
                        'f:lastTransitionTime': {},
                        'f:lastUpdateTime':     {},
                        'f:message':            {},
                        'f:reason':             {},
                        'f:status':             {},
                        'f:type':               {}
                      },
                      'k:{"type":"Progressing"}': {
                        '.':                    {},
                        'f:lastTransitionTime': {},
                        'f:lastUpdateTime':     {},
                        'f:message':            {},
                        'f:reason':             {},
                        'f:status':             {},
                        'f:type':               {}
                      }
                    },
                    'f:observedGeneration': {},
                    'f:readyReplicas':      {},
                    'f:replicas':           {},
                    'f:updatedReplicas':    {}
                  }
                },
                manager:     'kube-controller-manager',
                operation:   'Update',
                subresource: 'status',
                time:        '2022-11-04T11:37:50Z'
              }
            ],
            name:          'ns-filter-1',
            namespace:     'deployments-20',
            relationships: [
              {
                toType:      'pod',
                toNamespace: 'deployments-20',
                rel:         'creates',
                selector:    'app=ns-filter-1'
              },
              {
                toType: 'serviceaccount',
                rel:    'uses'
              },
              {
                toId:    'deployments-20/ns-filter-1-7d8b7956c9',
                toType:  'apps.replicaset',
                rel:     'owner',
                state:   'active',
                message: 'ReplicaSet is available. Replicas: 0'
              },
              {
                toId:    'deployments-20/ns-filter-1-68d798948f',
                toType:  'apps.replicaset',
                rel:     'owner',
                state:   'active',
                message: 'ReplicaSet is available. Replicas: 1'
              }
            ],
            resourceVersion: '1387831',
            state:           {
              error:         false,
              message:       'Deployment is available. Replicas: 1',
              name:          'active',
              transitioning: false
            },
            uid: '5690d9c4-f1bd-4507-b249-3d1b2eed8bfc'
          },
          spec: {
            progressDeadlineSeconds: 600,
            replicas:                1,
            revisionHistoryLimit:    10,
            selector:                { matchLabels: { app: 'ns-filter-1' } },
            strategy:                {
              rollingUpdate: {
                maxSurge:       '25%',
                maxUnavailable: '25%'
              },
              type: 'RollingUpdate'
            },
            template: {
              metadata: {
                creationTimestamp: null,
                labels:            { app: 'ns-filter-1' }
              },
              spec: {
                affinity:   {},
                containers: [
                  {
                    command: [
                      'bash',
                      '-c',
                      'echo test; sleep 10000; exit 1;'
                    ],
                    image:                    'ubuntu',
                    imagePullPolicy:          'Always',
                    name:                     'ns-filter',
                    resources:                {},
                    terminationMessagePath:   '/dev/termination-log',
                    terminationMessagePolicy: 'File'
                  }
                ],
                dnsPolicy:                     'ClusterFirst',
                restartPolicy:                 'Always',
                schedulerName:                 'default-scheduler',
                securityContext:               {},
                terminationGracePeriodSeconds: 30
              }
            }
          },
          status: {
            availableReplicas: 1,
            conditions:        [
              {
                error:              false,
                lastTransitionTime: '2022-11-02T14:24:14Z',
                lastUpdateTime:     '2022-11-02T17:57:13Z',
                message:            'ReplicaSet "ns-filter-1-68d798948f" has successfully progressed.',
                reason:             'NewReplicaSetAvailable',
                status:             'True',
                transitioning:      false,
                type:               'Progressing'
              },
              {
                error:              false,
                lastTransitionTime: '2022-11-04T11:37:50Z',
                lastUpdateTime:     '2022-11-04T11:37:50Z',
                message:            'Deployment has minimum availability.',
                reason:             'MinimumReplicasAvailable',
                status:             'True',
                transitioning:      false,
                type:               'Available'
              }
            ],
            observedGeneration: 11,
            readyReplicas:      1,
            replicas:           1,
            updatedReplicas:    1
          }
        });
      }

      return res;
    },

    createClass(json) {
      return json.map(j => new Deployment(j, this.$store));
    }
  }
};
</script>

<template>
  <ResourceTable
    :schema="schema"
    :rows="rows"
    :headers="$attrs.headers"
    :group-by="$attrs.groupBy"
    :loading="loading"
  />
</template>
