import { insertAt } from '@shell/utils/array';
import { colorForState, stateDisplay } from '@shell/plugins/dashboard-store/resource-class';
import { NODE, WORKLOAD_TYPES, POD, METRIC } from '@shell/config/types';
import { escapeHtml, shortenedImage } from '@shell/utils/string';
import WorkloadService from '@shell/models/workload.service';
import ChangeIndicator from '@shell/utils/change-indicator';
import { formatSi, parseSi } from '@shell/utils/units';

export const WORKLOAD_PRIORITY = {
  [WORKLOAD_TYPES.DEPLOYMENT]:             1,
  [WORKLOAD_TYPES.CRON_JOB]:               2,
  [WORKLOAD_TYPES.DAEMON_SET]:             3,
  [WORKLOAD_TYPES.STATEFUL_SET]:           4,
  [WORKLOAD_TYPES.JOB]:                    5,
  [WORKLOAD_TYPES.REPLICA_SET]:            6,
  [WORKLOAD_TYPES.REPLICATION_CONTROLLER]: 7,
};

ChangeIndicator.registerWithContext(POD, 'ready', {
  calc: (old, neu) => {
    const [oUp, oReq] = old.split('/');
    const [nUp, nReq] = neu.split('/');

    if (oReq === nReq) {
      if (oUp < nUp) {
        return {
          increased: true,
          positive:  true
        };
      }
      if (nUp < oUp) {
        return {
          increased: false,
          positive:  false
        };
      }
    }

    return null;
  }
});

ChangeIndicator.registerWithContext(POD, 'restarts', {
  calc: (old, neu) => {
    const [oUp] = old.split(' ');
    const [nUp] = neu.split(' ');

    if (oUp < nUp) {
      return {
        increased: true,
        positive:  false
      };
    }

    return null;
  }
});

ChangeIndicator.registerWithContext(POD, 'state', {
  calc: (old, neu) => {
    if (old === 'Running' && neu !== 'Running') {
      return {
        increased: false,
        positive:  false
      };
    }

    if (old !== 'Running' && neu === 'Running') {
      return {
        increased: true,
        positive:  true
      };
    }

    return null;
  }
});

ChangeIndicator.registerWithContext(POD, 'mem', {
  calc: (old, neu) => {
    if (!old && !neu) {
      return null;
    }

    if (!old && neu) {
      return {
        increased: true,
        positive:  false
      };
    }

    if (old && !neu) {
      return {
        increased: false,
        positive:  false
      };
    }

    old = parseSi(old);
    neu = parseSi(neu);

    if (old < neu) {
      return {
        increased: true,
        positive:  false,
      };
    }

    if (neu < old) {
      return {
        increased: false,
        positive:  true,
      };
    }

    return null;
  }
});

export default class Pod extends WorkloadService {
  _os = undefined;

  get inStore() {
    return this.$rootGetters['currentProduct'].inStore;
  }

  set os(operatingSystem) {
    this._os = operatingSystem;
  }

  get os() {
    if (this._os) {
      return this._os;
    }

    return this?.node?.status?.nodeInfo?.operatingSystem;
  }

  get node() {
    try {
      const schema = this.$store.getters[`cluster/schemaFor`](NODE);

      if (schema) {
        this.$dispatch(`find`, { type: NODE, id: this.spec.nodeName });
      }
    } catch {}

    return this.$getters['byId'](NODE, this.spec.nodeName);
  }

  get _availableActions() {
    const out = super._availableActions;

    // Add backwards, each one to the top
    insertAt(out, 0, { divider: true });
    insertAt(out, 0, this.openLogsMenuItem);
    insertAt(out, 0, this.openShellMenuItem);

    return out;
  }

  get openShellMenuItem() {
    return {
      action:  'openShell',
      enabled: !!this.links.view && this.isRunning,
      icon:    'icon icon-fw icon-chevron-right',
      label:   'Execute Shell',
      total:   1,
    };
  }

  get openLogsMenuItem() {
    return {
      action:  'openLogs',
      enabled: !!this.links.view,
      icon:    'icon icon-fw icon-chevron-right',
      label:   'View Logs',
      total:   1,
    };
  }

  get containerActions() {
    const out = [];

    insertAt(out, 0, this.openLogsMenuItem);
    insertAt(out, 0, this.openShellMenuItem);

    return out;
  }

  get defaultContainerName() {
    const containers = this.spec.containers;
    const desirable = containers.filter((c) => c.name !== 'istio-proxy');

    if ( desirable.length ) {
      return desirable[0].name;
    }

    return containers[0]?.name;
  }

  openShell(containerName = this.defaultContainerName) {
    this.$dispatch('wm/open', {
      id:        `${ this.id }-shell`,
      label:     this.nameDisplay,
      icon:      'terminal',
      component: 'ContainerShell',
      attrs:     {
        pod:              this,
        initialContainer: containerName
      }
    }, { root: true });
  }

  openLogs(containerName = this.defaultContainerName) {
    this.$dispatch('wm/open', {
      id:        `${ this.id }-logs`,
      label:     this.nameDisplay,
      icon:      'file',
      component: 'ContainerLogs',
      attrs:     {
        pod:              this,
        initialContainer: containerName
      }
    }, { root: true });
  }

  containerStateDisplay(status) {
    const state = Object.keys(status.state || {})[0];

    return stateDisplay(state);
  }

  containerStateColor(status) {
    const state = Object.keys(status.state || {})[0];

    return colorForState(state);
  }

  containerIsInit(container) {
    const { initContainers = [] } = this.spec;

    return initContainers.includes(container);
  }

  get imageNames() {
    return this.spec.containers.map((container) => shortenedImage(container.image));
  }

  get workloadRef() {
    const owners = this.getOwners() || [];
    const workloads = owners.filter((owner) => {
      return Object.values(WORKLOAD_TYPES).includes(owner.type);
    }).sort((a, b) => {
      // Prioritize types so that deployments come before replicasets and such.
      const ia = WORKLOAD_PRIORITY[a.type];
      const ib = WORKLOAD_PRIORITY[b.type];

      return ia - ib;
    });

    return workloads[0];
  }

  get ownedByWorkload() {
    return !!this.workloadRef;
  }

  get details() {
    const out = [
      {
        label:   this.t('workload.detailTop.podIP'),
        content: this.status.podIP
      },
    ];

    if ( this.workloadRef ) {
      out.push({
        label:         'Workload',
        formatter:     'LinkName',
        formatterOpts: {
          value:     this.workloadRef.name,
          type:      this.workloadRef.type,
          namespace: this.workloadRef.namespace
        },
        content: this.workloadRef.name
      });
    }

    if ( this.spec.nodeName ) {
      out.push({
        label:         'Node',
        formatter:     'LinkName',
        formatterOpts: { type: NODE, value: this.spec.nodeName },
        content:       this.spec.nodeName,
      });
    }

    return out;
  }

  get isRunning() {
    return this.status.phase === 'Running';
  }

  // Use by pod list to group the pods by node
  get groupByNode() {
    const name = this.spec?.nodeName || this.$rootGetters['i18n/t']('generic.none');

    return this.$rootGetters['i18n/t']('resourceTable.groupLabel.node', { name: escapeHtml(name) });
  }

  get restartCount() {
    if (this.status.containerStatuses) {
      return this.status?.containerStatuses[0].restartCount || 0;
    }

    return 0;
  }

  processSaveResponse(res) {
    if (res._headers && res._headers.warning) {
      const warnings = res._headers.warning.split('299') || [];
      const hasPsaWarnings = warnings.filter((warning) => warning.includes('violate PodSecurity')).length;

      if (hasPsaWarnings) {
        this.$dispatch('growl/warning', {
          title:   this.$rootGetters['i18n/t']('growl.podSecurity.title'),
          message: this.$rootGetters['i18n/t']('growl.podSecurity.message'),
          timeout: 5000,
        }, { root: true });
      }
    }
  }

  save() {
    const prev = { ...this };

    const { metadata, spec } = this.spec.template;

    this.spec = {
      ...this.spec,
      ...spec
    };

    this.metadata = {
      ...this.metadata,
      ...metadata
    };

    delete this.spec.template;

    // IF there is an error POD world model get overwritten
    // For the workloads this need be reset back
    return this._save(...arguments).catch((e) => {
      this.spec = prev.spec;
      this.metadata = prev.metadata;

      return Promise.reject(e);
    });
  }

  async fetchPodMetric() {
    if (this.$getters['schemaFor'](this.type)) {
      return this.$dispatch('find', { type: METRIC.POD, id: `${ this.id }` });
    }
  }

  get podMetric() {
    return this.$getters['byId'](METRIC.POD, this.id);
  }

  // get podMetricsSummary() {
  //   if (!this.podMetric) {
  //     this.fetchPodMetric(); // TODO: RC scale, spam
  //   }

  //   if (this.podMetric) {
  //     return this.podMetric.containers.reduce((r, c) => {
  //       r.cpu += parseSi(c.usage.cpu);
  //       r.mem += parseSi(c.usage.memory);

  //       return r;
  //     }, {
  //       cpu: 0,
  //       mem: 0
  //     });
  //   }

  //   return null;
  // }

  get cpu() {
    // console.warn(this.podMetricsSummary?.cpu, formatSi(this.podMetricsSummary?.cpu, { increment: 1000, suffix: 'C' }));
    // if (!this.podMetric) {
    //   this.fetchPodMetric(); // TODO: RC scale, spam
    // }

    // return formatSi(this.podMetricsSummary?.cpu, { increment: 1000, suffix: 'C' });
    return this.podMetric?.totalCpuUsage;
  }

  get mem() {
    // return formatSi(this.podMetricsSummary?.cpu, {
    //   increment: 1024, suffix: 'iB', firstSuffix: 'B'
    // }); // TODO: RC ??
    return this.podMetric?.totalMemoryUsage;
  }
}
