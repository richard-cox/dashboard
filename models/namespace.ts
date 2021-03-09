import { PROJECT, SYSTEM_NAMESPACE, ISTIO as ISTIO_LABELS } from '@/config/labels-annotations';
import SYSTEM_NAMESPACES from '@/config/system-namespaces';
import { ISTIO, MANAGEMENT } from '~/config/types';
// ResourceInstanceForProxy
import { BaseResource, ProxiedResource, ProxyResourceInstance, ResourceInstanceForProxy } from '~/plugins/steve/resource.types';
import { insertAt, isArray } from '~/utils/array';
import { escapeHtml } from '~/utils/string';

export interface RancherProject {

}

export interface IDashboardProject {
  isSystem: boolean;
}

export interface KubeNamespace extends BaseResource {

}

export interface NamespaceModel extends ProxyResourceInstance {
  isSystem: boolean;
  projectId: string;
  project: ProxiedResource<IDashboardProject, RancherProject>;
  projectNameSort: string;
  istioInstalled: boolean;
  injectionEnabled: boolean;
  enableAutoInjection: (namespaces: any | any[], enable: boolean) => void;
  disableAutoInjection: (namespaces: any | any[]) => void;
}

export type DashboardNamespaceType = ProxiedResource<NamespaceModel, KubeNamespace>

// KEEP! Commented out to avoid build failures in remaining areas to fix
// export const dashboardNamespace: ResourceInstanceForProxy<ProxiedResource<NamespaceModel, KubeNamespace>> = {
//   _availableActions(proxy) {
//     const out = this._standardActions(proxy);

//     insertAt(out, 0, { divider: true });
//     if (this.istioInstalled) {
//       insertAt(out, 0, {
//         action:     'enableAutoInjection',
//         label:      this.t('namespace.enableAutoInjection'),
//         bulkable:   true,
//         bulkAction: 'enableAutoInjection',
//         enabled:    !this.injectionEnabled,
//         icon:       'icon icon-plus',
//         weight:     2

//       });
//       insertAt(out, 0, {
//         action:     'disableAutoInjection',
//         label:      this.t('namespace.disableAutoInjection'),
//         bulkable:   true,
//         bulkAction: 'disableAutoInjection',
//         enabled:    this.injectionEnabled,
//         icon:       'icon icon-minus',
//         weight:     1,
//       });
//     }

//     return out;
//   },

//   isSystem() {
//     if ( this.metadata?.annotations?.[SYSTEM_NAMESPACE] === 'true' ) {
//       return true;
//     }

//     if ( SYSTEM_NAMESPACES.includes(this.metadata.name) ) {
//       return true;
//     }

//     if ( this.metadata.name.endsWith('-system') ) {
//       return true;
//     }

//     if ( this.project ) {
//       return this.project.isSystem;
//     }

//     return false;
//   },

//   projectId() {
//     return this.metadata?.labels?.[PROJECT] || null;
//   },

//   project() {
//     if ( !this.projectId || !this.$rootGetters['isMultiCluster'] ) {
//       return null;
//     }

//     const clusterId = this.$rootGetters['currentCluster'].id;
//     const project = this.$rootGetters['management/byId'](MANAGEMENT.PROJECT, `${ clusterId }/${ this.projectId }`);

//     return project;
//   },

//   groupByLabel() {
//     const name = this.project?.nameDisplay;

//     if ( name ) {
//       return this.$rootGetters['i18n/t']('resourceTable.groupLabel.project', { name: escapeHtml(name) });
//     } else {
//       return this.$rootGetters['i18n/t']('resourceTable.groupLabel.notInAProject');
//     }
//   },

//   projectNameSort() {
//     return this.project?.nameSort || '';
//   },

//   istioInstalled() {
//     const schema = this.$rootGetters['cluster/schemaFor'](ISTIO.GATEWAY);

//     return !!schema;
//   },

//   injectionEnabled() {
//     return this.labels[ISTIO_LABELS.AUTO_INJECTION] === 'enabled';
//   },

//   enableAutoInjection() {
//     return (namespaces: DashboardNamespaceType | DashboardNamespaceType[], enable = true) => {
//       const safeNamespaces: DashboardNamespaceType[] = isArray(namespaces) ? namespaces as DashboardNamespaceType[] : [namespaces as DashboardNamespaceType];

//       safeNamespaces.forEach((ns) => {
//         if (!enable && ns?.metadata?.labels) {
//           delete ns.metadata.labels[ISTIO_LABELS.AUTO_INJECTION];
//         } else {
//           if (!ns.metadata.labels) {
//             ns.metadata.labels = {};
//           }
//           ns.metadata.labels[ISTIO_LABELS.AUTO_INJECTION] = 'enabled';
//         }
//         ns.save();
//       });
//     };
//   },

//   disableAutoInjection(proxy) {
//     return (namespaces: DashboardNamespaceType | DashboardNamespaceType[]) => {
//       this.enableAutoInjection(proxy)(namespaces, false);
//     };
//   },
// };
